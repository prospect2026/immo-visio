'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Message } from '@/types/database';

function formatHeure(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatJour(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getNom(email: string): string {
  const lower = email.toLowerCase();
  if (lower.includes('rhodes') || lower.includes('denzel')) return 'RHODES';
  if (lower.includes('bomboma')) return 'BOMBOMA';
  return email.split('@')[0].toUpperCase();
}

export function MessagerieClient({
  messages: initial,
  userId,
  userEmail,
}: {
  messages: Message[];
  userId: string;
  userEmail: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [contenu, setContenu] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.auteur_id !== userId) {
          supabase.from('messages').update({ lu_par_destinataire: true }).eq('id', newMsg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    setSending(true);

    await supabase.from('messages').insert({
      auteur_id: userId,
      contenu: contenu.trim(),
    });

    setContenu('');
    setSending(false);
  }

  let dernierJour = '';

  return (
    <>
      <div className="bg-card border-b border-border px-4 py-3 shrink-0">
        <h1 className="text-lg font-bold text-primary">Messages</h1>
        <p className="text-xs text-muted">Conversation RHODES — BOMBOMA</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-background">
        {messages.length === 0 && (
          <p className="text-center text-muted py-12">Aucun message. Commencez la conversation !</p>
        )}
        {messages.map((msg) => {
          const estMoi = msg.auteur_id === userId;
          const jour = formatJour(msg.created_at);
          let showDateSep = false;
          if (jour !== dernierJour) {
            dernierJour = jour;
            showDateSep = true;
          }

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="text-center my-3">
                  <span className="text-[10px] bg-gray-200 text-muted px-3 py-1 rounded-full">{jour}</span>
                </div>
              )}
              <div className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  estMoi
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-card border border-border rounded-bl-md'
                }`}>
                  {!estMoi && (
                    <p className="text-[10px] font-bold text-primary mb-0.5">
                      {getNom(userEmail) === 'RHODES' ? 'BOMBOMA' : 'RHODES'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1 ${estMoi ? 'text-white/60' : 'text-muted'}`}>
                    {formatHeure(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={envoyer} className="bg-card border-t border-border px-4 py-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 border border-border rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !contenu.trim()}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </>
  );
}
