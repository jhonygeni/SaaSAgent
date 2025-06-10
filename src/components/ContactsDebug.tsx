import React from 'react';
import { useContacts } from '@/hooks/useContacts';

export function ContactsDebug() {
  const { contacts, isLoading, error, totalContacts } = useContacts();

  console.log('🐛 ContactsDebug:', {
    contacts,
    isLoading,
    error,
    totalContacts,
    contactsLength: contacts.length
  });

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🐛 Contacts Debug</h4>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Error: {error || 'None'}</div>
      <div>Total: {totalContacts}</div>
      <div>Contacts: {contacts.length}</div>
      {contacts.slice(0, 2).map(contact => (
        <div key={contact.id} style={{ marginTop: '5px', fontSize: '11px' }}>
          • {contact.name} ({contact.status})
        </div>
      ))}
    </div>
  );
}
