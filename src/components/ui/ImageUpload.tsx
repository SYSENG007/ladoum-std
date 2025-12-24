import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    required?: boolean;
    farmId?: string; // Added for farm-specific folder organization
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'duogfbb5p';
const CLOUDINARY_UPLOAD_PRESET = 'ladoum_std'; // Note: No spaces allowed in preset name

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    label = "Photo",
    required = false,
    farmId // Extract farmId prop
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(value);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Detect if device is mobile/tablet (not desktop PC)
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
            const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth < 1024;

            // Consider it mobile if: mobile user agent OR (touch screen AND small screen)
            setIsMobile(isMobileDevice || (hasTouchScreen && isSmallScreen));
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 800;
                    let { width, height } = img;

                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Compression failed'));
                        },
                        'image/jpeg',
                        0.7
                    );
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const uploadToCloudinary = async (file: Blob): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // Add farm-specific folder if farmId is provided
        if (farmId) {
            formData.append('folder', `ladoum-std/farms/${farmId}`);
        }

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_400/');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Veuillez sélectionner une image valide');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setUploadError('L\'image ne doit pas dépasser 10 MB');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const compressedBlob = await compressImage(file);
            const imageUrl = await uploadToCloudinary(compressedBlob);
            onChange(imageUrl);
            setPreviewUrl(imageUrl);
        } catch (err) {
            console.error('Error uploading image:', err);
            setUploadError('Erreur lors du téléchargement. Réessayez.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const clearImage = () => {
        onChange('');
        setPreviewUrl('');
        setUploadError(null);
    };

    const triggerCamera = () => {
        if (isMobile) {
            cameraInputRef.current?.click();
        }
    };

    const triggerGallery = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Hidden inputs for camera and gallery */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
                {/* Camera Button - Only on mobile */}
                {isMobile && (
                    <button
                        type="button"
                        onClick={triggerCamera}
                        disabled={uploading}
                        className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors disabled:opacity-50"
                    >
                        <div className="p-3 bg-emerald-100 rounded-full">
                            <Camera className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Caméra</span>
                    </button>
                )}

                {/* Gallery Button - Always available */}
                <button
                    type="button"
                    onClick={triggerGallery}
                    disabled={uploading}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-colors disabled:opacity-50 ${!isMobile ? 'w-full' : ''}`}
                >
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                            <span className="text-sm text-blue-600 font-medium">Téléchargement...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-blue-100 rounded-full">
                                {isMobile ? (
                                    <ImageIcon className="w-6 h-6 text-blue-600" />
                                ) : (
                                    <Upload className="w-6 h-6 text-blue-600" />
                                )}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                {isMobile ? 'Galerie' : 'Choisir une image'}
                            </span>
                        </>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {uploadError}
                </div>
            )}

            {/* Image Preview */}
            {previewUrl && (
                <div className="relative">
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <img
                            src={previewUrl}
                            alt="Aperçu"
                            className="w-full h-48 object-cover"
                            onError={() => setUploadError('Impossible de charger l\'image')}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {!previewUrl && (
                <p className="text-xs text-slate-500">
                    Photo optionnelle - une image par défaut sera utilisée si non fournie
                </p>
            )}
        </div>
    );
};
