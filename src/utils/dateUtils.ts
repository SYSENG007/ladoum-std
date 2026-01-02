export const calculateDetailedAge = (birthDate: string): { years: number; months: number; days: number; totalMonths: number; ageString: string } => {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = years * 12 + months;

    let ageString = '';
    if (years > 0) ageString += `${years} an${years > 1 ? 's' : ''}`;
    if (months > 0) ageString += (ageString ? ' ' : '') + `${months} mois`;
    // If only days old (0 years, 0 months)
    if (years === 0 && months === 0) ageString = `${days} jour${days > 1 ? 's' : ''}`;
    // If 0 days (born today), fallback
    if (ageString === '') ageString = 'Né aujourd\'hui';

    return { years, months, days, totalMonths, ageString };
};
