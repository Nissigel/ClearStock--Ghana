import { useState } from 'react';
import { api } from '../lib/api';

export interface ContactTarget {
  userId: number;
  name: string;
  phone?: string | null;
  email?: string | null;
}

/** WhatsApp needs the international 233… form; tel: is fine with the local one. */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return '233' + digits.slice(1);
  if (digits.length === 9) return '233' + digits;
  return digits;
}

/**
 * Lets an admin reach a user: call / WhatsApp / email them directly, or send an
 * in-app message that also emails them when an address is on file.
 */
export function ContactModal({
  target,
  onClose,
}: {
  target: ContactTarget | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (!target) return null;

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/admin/users/${target.userId}/contact`, {
        message: message.trim(),
      });
      setSent(true);
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>Contact {target.name}</h3>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            margin: '12px 0',
          }}
        >
          {target.phone ? (
            <>
              <a className="btn-sm btn-outline" href={`tel:${target.phone}`}>
                Call {target.phone}
              </a>
              <a
                className="btn-sm btn-outline"
                href={`https://wa.me/${waNumber(target.phone)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </>
          ) : null}
          {target.email ? (
            <a className="btn-sm btn-outline" href={`mailto:${target.email}`}>
              Email {target.email}
            </a>
          ) : null}
          {!target.phone && !target.email ? (
            <p className="muted" style={{ margin: 0 }}>
              No phone or email on file for this user.
            </p>
          ) : null}
        </div>

        <label htmlFor="contact-message">Or send an in-app message</label>
        <textarea
          id="contact-message"
          rows={4}
          placeholder="They'll get this in their ClearStock notifications, and by email if they have one on file."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error ? (
          <p className="error" style={{ marginTop: 8 }}>
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="muted" style={{ marginTop: 8 }}>
            Message sent ✓
          </p>
        ) : null}

        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary"
            onClick={send}
            disabled={sending || !message.trim()}
          >
            {sending ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </div>
    </div>
  );
}
