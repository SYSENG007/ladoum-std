import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ConsultationMessage } from '../../types/consultation';
import clsx from 'clsx';

interface ConsultationChatProps {
    messages: ConsultationMessage[];
    currentUserId: string;
    currentUserRole: 'Farmer' | 'Vet';
    currentUserName: string;
    onSendMessage: (content: string, type: 'text' | 'image' | 'video', mediaUrl?: string) => void;
    disabled?: boolean;
}

export const ConsultationChat: React.FC<ConsultationChatProps> = ({
    messages,
    currentUserId,
    currentUserRole: _currentUserRole,
    currentUserName: _currentUserName,
    onSendMessage,
    disabled = false
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim() && !mediaPreview) return;

        if (mediaPreview) {
            onSendMessage(newMessage, mediaPreview.type, mediaPreview.url);
            setMediaPreview(null);
        } else {
            onSendMessage(newMessage.trim(), 'text');
        }
        setNewMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const url = URL.createObjectURL(file);
        setMediaPreview({ url, type });
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>Aucun message. Commencez la conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={clsx(
                                    'flex flex-col max-w-[80%]',
                                    isOwn ? 'ml-auto items-end' : 'items-start'
                                )}
                            >
                                {/* Sender name */}
                                <span className="text-xs text-slate-400 mb-1 px-2">
                                    {msg.senderName} • {msg.senderRole === 'Vet' ? 'Vétérinaire' : 'Éleveur'}
                                </span>

                                {/* Message bubble */}
                                <div
                                    className={clsx(
                                        'rounded-2xl px-4 py-2 shadow-sm',
                                        isOwn
                                            ? 'bg-primary-600 text-white rounded-br-md'
                                            : 'bg-white text-slate-900 rounded-bl-md border border-slate-200'
                                    )}
                                >
                                    {/* Media content */}
                                    {msg.mediaUrl && msg.type === 'image' && (
                                        <img
                                            src={msg.mediaUrl}
                                            alt="Image partagée"
                                            className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                                        />
                                    )}
                                    {msg.mediaUrl && msg.type === 'video' && (
                                        <video
                                            src={msg.mediaUrl}
                                            controls
                                            className="max-w-full rounded-lg mb-2 max-h-48"
                                        />
                                    )}

                                    {/* Text content */}
                                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                </div>

                                {/* Timestamp */}
                                <span className={clsx(
                                    'text-xs mt-1 px-2',
                                    isOwn ? 'text-slate-400' : 'text-slate-400'
                                )}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Media preview */}
            {mediaPreview && (
                <div className="px-4 py-2 border-t border-slate-200 bg-white">
                    <div className="relative inline-block">
                        {mediaPreview.type === 'image' ? (
                            <img
                                src={mediaPreview.url}
                                alt="Aperçu"
                                className="h-20 rounded-lg object-cover"
                            />
                        ) : (
                            <video
                                src={mediaPreview.url}
                                className="h-20 rounded-lg"
                            />
                        )}
                        <button
                            onClick={() => setMediaPreview(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
                <div className="flex gap-2 items-end">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Image className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Écrivez votre message..."
                            disabled={disabled}
                            rows={1}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                        />
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={disabled || (!newMessage.trim() && !mediaPreview)}
                        icon={Send}
                        className="shrink-0"
                    >
                        Envoyer
                    </Button>
                </div>
            </div>
        </div>
    );
};
