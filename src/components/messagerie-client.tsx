'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const [enLigne, setEnLigne] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(initial.length);
  const supabaseRef = useRef(createClient());

  // Scroll vers le bas quand de nouveaux messages arrivent
  const scrollEnBas = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  // Scroll initial au montage
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, []);

  // Scroll auto quand le nombre de messages change
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      scrollEnBas();
    }
    prevCountRef.current = messages.length;
  }, [messages.length, scrollEnBas]);

  // Marquer les messages de l'autre comme lus
  const marquerLus = useCallback(async (msgs: Message[]) => {
    const supabase = supabaseRef.current;
    const nonLus = msgs.filter((m) => m.auteur_id !== userId && !m.lu_par_destinataire);
    if (nonLus.length > 0) {
      const ids = nonLus.map((m) => m.id);
      await supabase.from('messages').update({ lu_par_destinataire: true }).in('id', ids);
    }
  }, [userId]);

  // Fetch les messages depuis Supabase
  const fetchMessages = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      setEnLigne(false);
      return;
    }

    setEnLigne(true);

    // Mettre à jour seulement s'il y a du nouveau (comparaison par nombre + dernier id)
    setMessages((prev) => {
      if (data.length !== prev.length || (data.length > 0 && prev.length > 0 && data[data.length - 1].id !== prev[prev.length - 1].id)) {
        marquerLus(data);
        return data;
      }
      return prev;
    });
  }, [marquerLus]);

  // Realtime Supabase — tentative de connexion, agit en complément du polling
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          // Éviter les doublons (le message optimiste ou le poll pourrait l'avoir déjà ajouté)
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.auteur_id !== userId) {
          supabase.from('messages').update({ lu_par_destinataire: true }).eq('id', newMsg.id).then();
        }
      })
      .subscribe((status) => {
        setEnLigne(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Polling toutes les 3 secondes — filet de sécurité si le Realtime ne fonctionne pas
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Envoi de message avec insertion optimiste
  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const texte = contenu.trim();
    if (!texte) return;
    setSending(true);
    setContenu('');

    // Message optimiste — apparaît instantanément
    const msgOptimiste: Message = {
      id: `optimistic-${Date.now()}`,
      auteur_id: userId,
      contenu: texte,
      lu_par_destinataire: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msgOptimiste]);

    // Insert en base
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from('messages')
      .insert({ auteur_id: userId, contenu: texte })
      .select()
      .single();

    // Remplacer le message optimiste par le vrai message retourné par Supabase
    if (data) {
      setMessages((prev) =>
        prev.map((m) => m.id === msgOptimiste.id ? data : m)
      );
    }

    setSending(false);
  }

  // Variable pour les séparateurs de date dans le rendu
  let dernierJour = '';

  return (
    <>
      {/* En-tête avec indicateur en ligne */}
      <div className="bg-card border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary">Messages</h1>
            <p className="text-xs text-muted">Conversation RHODES — BOMBOMA</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${enLigne ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-[10px] font-medium ${enLigne ? 'text-green-600' : 'text-muted'}`}>
              {enLigne ? 'En ligne' : 'Reconnexion...'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
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
          const estOptimiste = msg.id.startsWith('optimistic-');

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
                } ${estOptimiste ? 'opacity-70' : ''}`}>
                  {!estMoi && (
                    <p className="text-[10px] font-bold text-primary mb-0.5">
                      {getNom(userEmail) === 'RHODES' ? 'BOMBOMA' : 'RHODES'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1 ${estMoi ? 'text-white/60' : 'text-muted'}`}>
                    {estOptimiste ? 'Envoi...' : formatHeure(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone de saisie */}
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
