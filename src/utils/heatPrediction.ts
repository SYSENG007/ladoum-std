/**
 * Heat Prediction Utilities for Ladoum Sheep
 * Predicts next heat cycles based on reproductive history
 */

import type { Animal, HeatPrediction, GestationPrediction, ReproductionRecord, ReproductiveStatus } from '../types';

// Default cycle parameters for Ladoum sheep
const DEFAULT_CYCLE_LENGTH = 17; // days
const SURVEILLANCE_WINDOW = 2; // ±2 days for heat
const GESTATION_SURVEILLANCE_WINDOW = 5; // ±5 days for birth
const POST_PARTUM_DELAY = 45; // days after birth before returning to heat
const LACTATION_DELAY_FACTOR = 1.2; // Cycle can be extended during heavy lactation

// Gestation period for sheep
const GESTATION_PERIOD = 150; // days (~5 months)

/**
 * Extract heat events from reproduction records
 */
export function getHeatHistory(records: ReproductionRecord[] | undefined): ReproductionRecord[] {
    if (!records) return [];
    return records
        .filter(r => r.type === 'Heat')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate average cycle length from heat history
 */
export function calculateAverageCycleLength(records: ReproductionRecord[] | undefined): number {
    const heats = getHeatHistory(records);

    if (heats.length < 2) return DEFAULT_CYCLE_LENGTH;

    let totalDays = 0;
    let cycleCount = 0;

    for (let i = 1; i < heats.length; i++) {
        const prevDate = new Date(heats[i - 1].date);
        const currDate = new Date(heats[i].date);
        const daysBetween = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        // Only count reasonable cycle lengths (12-25 days)
        if (daysBetween >= 12 && daysBetween <= 25) {
            totalDays += daysBetween;
            cycleCount++;
        }
    }

    return cycleCount > 0 ? Math.round(totalDays / cycleCount) : DEFAULT_CYCLE_LENGTH;
}

/**
 * Get the last significant reproductive event
 */
export function getLastReproductiveEvent(records: ReproductionRecord[] | undefined): ReproductionRecord | null {
    if (!records || records.length === 0) return null;

    const sorted = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sorted[0];
}

/**
 * Determine current reproductive status of a female
 */
export function getReproductiveStatus(animal: Animal): ReproductiveStatus {
    if (animal.gender !== 'Female') return 'Available';

    const records = animal.reproductionRecords;
    if (!records || records.length === 0) return 'Available';

    const today = new Date();
    const sortedRecords = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const record of sortedRecords) {
        const recordDate = new Date(record.date);
        const daysSinceRecord = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (record.type) {
            case 'Heat':
                // If heat was within last 2 days, consider in heat
                if (daysSinceRecord <= 2) return 'InHeat';
                break;

            case 'Mating':
                // Check for subsequent "Negative" ultrasound
                const negativeUltrasound = sortedRecords.some(
                    r => r.type === 'Ultrasound' &&
                        r.ultrasoundResult === 'Negative' &&
                        new Date(r.date) > recordDate
                );

                if (negativeUltrasound) continue; // Skip to next record

                // If mating was within gestation period (extended for overdue) and no birth recorded after
                if (daysSinceRecord < GESTATION_PERIOD + 15) { // Allow 15 days overdue
                    // Check if there's a birth or abortion after this
                    const hasOutcomeAfter = sortedRecords.some(
                        r => (r.type === 'Birth' || r.type === 'Abortion') &&
                            new Date(r.date) > recordDate
                    );
                    if (!hasOutcomeAfter) return 'Pregnant';
                }
                break;

            case 'Ultrasound':
                // If checking an Ultrasound directly as the latest event
                if (record.ultrasoundResult === 'Negative') {
                    // Treated as "Checked and Empty" -> Available (or Resting if recent abortion/birth prior)
                    // But we should keep looking back in history if this was just a check
                    continue;
                }

                // Positive Ultrasound
                if (daysSinceRecord < GESTATION_PERIOD + 15) {
                    const hasOutcomeAfter = sortedRecords.some(
                        r => (r.type === 'Birth' || r.type === 'Abortion') &&
                            new Date(r.date) > recordDate
                    );
                    if (!hasOutcomeAfter) return 'Pregnant';
                }
                break;

            case 'Birth':
                // If birth was within lactation period (typically 60-90 days)
                if (daysSinceRecord < 90) {
                    // Check for weaning
                    const hasWeaning = sortedRecords.some(
                        r => r.type === 'Weaning' && new Date(r.date) > recordDate
                    );
                    if (!hasWeaning) return 'Lactating';
                }
                // If just given birth but not nursing, might be resting
                if (daysSinceRecord < POST_PARTUM_DELAY) return 'Resting';
                break;

            case 'Abortion':
                // Resting period after abortion
                if (daysSinceRecord < 30) return 'Resting';
                break;

            case 'Lactation':
                // Active lactation
                if (daysSinceRecord < 90) return 'Lactating';
                break;
        }
    }

    return 'Available';
}

/**
 * Predict next heat date for a female
 */
export function predictNextHeat(animal: Animal): HeatPrediction | null {
    if (animal.gender !== 'Female') return null;

    const status = getReproductiveStatus(animal);
    const records = animal.reproductionRecords;
    const avgCycleLength = calculateAverageCycleLength(records);
    const heats = getHeatHistory(records);

    let baseDate: Date;
    let adjustedCycleLength = avgCycleLength;

    // Determine base date for prediction based on status
    switch (status) {
        case 'Pregnant':
            // Cannot predict - return null or estimated post-partum date
            const lastMating = records?.find(r => r.type === 'Mating' || r.type === 'Ultrasound');
            if (lastMating) {
                const expectedBirth = new Date(lastMating.date);
                expectedBirth.setDate(expectedBirth.getDate() + GESTATION_PERIOD);
                baseDate = new Date(expectedBirth);
                baseDate.setDate(baseDate.getDate() + POST_PARTUM_DELAY);
            } else {
                return null;
            }
            break;

        case 'Lactating':
            // Find last birth and estimate based on weaning
            const lastBirth = records?.find(r => r.type === 'Birth');
            if (lastBirth) {
                baseDate = new Date(lastBirth.date);
                baseDate.setDate(baseDate.getDate() + POST_PARTUM_DELAY);
                // Extend cycle during lactation
                adjustedCycleLength = Math.round(avgCycleLength * LACTATION_DELAY_FACTOR);
            } else {
                baseDate = new Date();
            }
            break;

        case 'Resting':
            // Use last event + recovery period
            const lastEvent = getLastReproductiveEvent(records);
            if (lastEvent) {
                baseDate = new Date(lastEvent.date);
                baseDate.setDate(baseDate.getDate() + (lastEvent.type === 'Birth' ? POST_PARTUM_DELAY : 30));
            } else {
                baseDate = new Date();
            }
            break;

        case 'InHeat':
            // Already in heat - next one is in ~17 days
            const currentHeat = heats[heats.length - 1];
            if (currentHeat) {
                baseDate = new Date(currentHeat.date);
                baseDate.setDate(baseDate.getDate() + avgCycleLength);
            } else {
                baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + avgCycleLength);
            }
            break;

        case 'Available':
        default:
            // Use last heat as base
            if (heats.length > 0) {
                const lastHeat = heats[heats.length - 1];
                baseDate = new Date(lastHeat.date);
                // Calculate how many cycles have passed
                const daysSinceLastHeat = Math.floor(
                    (new Date().getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                const cyclesPassed = Math.floor(daysSinceLastHeat / avgCycleLength);
                baseDate.setDate(baseDate.getDate() + (cyclesPassed + 1) * avgCycleLength);
            } else {
                // No heat history - estimate based on general timeline
                // Default to 7 days from now as placeholder
                baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + 7);
            }
            break;
    }

    // Ensure prediction is in the future
    const today = new Date();
    while (baseDate <= today) {
        baseDate.setDate(baseDate.getDate() + adjustedCycleLength);
    }

    // Calculate surveillance window
    const windowStart = new Date(baseDate);
    windowStart.setDate(windowStart.getDate() - SURVEILLANCE_WINDOW);

    const windowEnd = new Date(baseDate);
    windowEnd.setDate(windowEnd.getDate() + SURVEILLANCE_WINDOW);

    // Determine confidence based on data availability
    let confidence: 'Low' | 'Medium' | 'High' = 'Low';
    if (heats.length >= 5) {
        confidence = 'High';
    } else if (heats.length >= 2) {
        confidence = 'Medium';
    }

    return {
        nextHeatDate: baseDate.toISOString().split('T')[0],
        windowStart: windowStart.toISOString().split('T')[0],
        windowEnd: windowEnd.toISOString().split('T')[0],
        confidence,
        basedOnCycles: heats.length,
        averageCycleLength: avgCycleLength,
        reproductiveStatus: status
    };
}

/**
 * Get all females with upcoming heats in the next N days
 */
export function getUpcomingHeats(
    animals: Animal[],
    days: number = 7
): Array<{ animal: Animal; prediction: HeatPrediction }> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const results: Array<{ animal: Animal; prediction: HeatPrediction }> = [];

    const females = animals.filter(a => a.gender === 'Female' && a.status === 'Active');

    for (const animal of females) {
        const prediction = predictNextHeat(animal);
        if (prediction) {
            const nextHeatDate = new Date(prediction.nextHeatDate);
            // Include if within range or window overlaps
            const windowStart = new Date(prediction.windowStart);
            if (windowStart <= endDate && nextHeatDate >= today) {
                results.push({ animal, prediction });
            }
        }
    }

    // Sort by soonest heat date
    results.sort((a, b) =>
        new Date(a.prediction.nextHeatDate).getTime() - new Date(b.prediction.nextHeatDate).getTime()
    );

    return results;
}

/**
 * Format reproductive status for display
 */
export function formatReproductiveStatus(status: ReproductiveStatus): string {
    const statusLabels: Record<ReproductiveStatus, string> = {
        'Available': 'Disponible',
        'InHeat': 'En chaleur',
        'Pregnant': 'Gestante',
        'Lactating': 'Allaitante',
        'Resting': 'Repos'
    };
    return statusLabels[status];
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: ReproductiveStatus): string {
    const statusColors: Record<ReproductiveStatus, string> = {
        'Available': 'success',
        'InHeat': 'warning',
        'Pregnant': 'info',
        'Lactating': 'info',
        'Resting': 'default'
    };
    return statusColors[status];
}

/**
 * Predict birth date for a pregnant female
 * Returns null if the animal is not pregnant
 */
export function predictBirthDate(animal: Animal): GestationPrediction | null {
    if (animal.gender !== 'Female') return null;

    const records = animal.reproductionRecords;
    if (!records || records.length === 0) return null;

    // Find the most recent mating or ultrasound event without a subsequent birth
    const sortedRecords = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Find mating event
    const matingEvent = sortedRecords.find(r => r.type === 'Mating' || r.type === 'Ultrasound');
    if (!matingEvent) return null;

    const matingDate = new Date(matingEvent.date);

    // Check for Negative Ultrasound after mating
    const negativeUltrasound = sortedRecords.some(
        r => r.type === 'Ultrasound' &&
            r.ultrasoundResult === 'Negative' &&
            new Date(r.date) > matingDate
    );
    if (negativeUltrasound) return null;

    // Check if there's a birth or abortion after this mating
    const hasOutcome = sortedRecords.some(
        r => (r.type === 'Birth' || r.type === 'Abortion') &&
            new Date(r.date) > matingDate
    );

    if (hasOutcome) return null;

    // Check if still within gestation period (allow 15 days overdue)
    const today = new Date();
    const daysSinceMating = Math.floor(
        (today.getTime() - matingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceMating > GESTATION_PERIOD + 15) {
        // Gestation period exceeded significantly - might have missed recording the birth
        return null;
    }

    // Calculate expected birth date
    const expectedBirthDate = new Date(matingDate);
    expectedBirthDate.setDate(expectedBirthDate.getDate() + GESTATION_PERIOD);

    // Calculate surveillance window (±5 days)
    const windowStart = new Date(expectedBirthDate);
    windowStart.setDate(windowStart.getDate() - GESTATION_SURVEILLANCE_WINDOW);

    const windowEnd = new Date(expectedBirthDate);
    windowEnd.setDate(windowEnd.getDate() + GESTATION_SURVEILLANCE_WINDOW);

    const daysRemaining = Math.ceil(
        (expectedBirthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine confidence based on ultrasound confirmation
    let confidence: 'Low' | 'Medium' | 'High' = 'Medium';
    const hasPositiveUltrasound = sortedRecords.some(
        r => r.type === 'Ultrasound' &&
            (!r.ultrasoundResult || r.ultrasoundResult === 'Positive') &&
            new Date(r.date) > matingDate
    );

    if (hasPositiveUltrasound) {
        confidence = 'High';
    } else if (daysSinceMating < 45) {
        // Very early - lower confidence
        confidence = 'Low';
    }

    return {
        expectedBirthDate: expectedBirthDate.toISOString().split('T')[0],
        windowStart: windowStart.toISOString().split('T')[0],
        windowEnd: windowEnd.toISOString().split('T')[0],
        daysRemaining,
        matingDate: matingEvent.date,
        confidence
    };
}

/**
 * Get all pregnant females with upcoming births in the next N days
 */
export function getUpcomingBirths(
    animals: Animal[],
    days: number = 14
): Array<{ animal: Animal; prediction: GestationPrediction }> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const results: Array<{ animal: Animal; prediction: GestationPrediction }> = [];

    const females = animals.filter(a => a.gender === 'Female' && a.status === 'Active');

    for (const animal of females) {
        const prediction = predictBirthDate(animal);
        if (prediction) {
            const windowStart = new Date(prediction.windowStart);
            const expectedDate = new Date(prediction.expectedBirthDate);

            // Include if surveillance window starts within range
            if (windowStart <= endDate && expectedDate >= today) {
                results.push({ animal, prediction });
            }
        }
    }

    // Sort by soonest birth date
    results.sort((a, b) =>
        new Date(a.prediction.expectedBirthDate).getTime() -
        new Date(b.prediction.expectedBirthDate).getTime()
    );

    return results;
}
