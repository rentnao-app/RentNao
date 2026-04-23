import { Link } from 'react-router-dom';

const FAQ = [
  {
    q: '1. What is Rent Nao?',
    intro:
      'Rent Nao is a digital platform that connects property owners and tenants directly without brokers.',
    bullets: [
      'Owners can list properties for free.',
      'Tenants can search, filter, and contact verified listings easily.',
      'Optional services include featured listings, tenant verification, rent agreements, and rent management.',
      'Owners and tenants communicate directly; we do not interfere in rent negotiations.',
    ],
  },
  {
    q: '2. How do I list my property on Rent Nao?',
    intro: 'Listing your property is simple and free.',
    bullets: [
      'Create an account or log in.',
      'Click "List Property".',
      'Enter property details (location, rent, size, type, and availability).',
      'Upload photos.',
      'Submit your listing.',
      'After approval, your property goes live and is visible to tenants.',
      'You only pay if you choose optional premium services (for example, featured listing or tenant verification).',
    ],
  },
  {
    q: '3. What types of properties can be listed?',
    intro: 'You can list:',
    bullets: [
      'Residential apartments',
      'Houses',
      'Bachelor flats',
      'Family units',
      'Commercial spaces',
      'Office spaces',
      'Shops',
      'Warehouses',
    ],
    outro: 'Any property that is legally available for rent can be listed on Rent Nao.',
  },
  {
    q: '4. How can I successfully register on this website?',
    intro: 'To register:',
    bullets: [
      'Click Sign Up',
      'Enter your name, phone number, and email',
      'Set your password',
      'Complete your profile',
    ],
    outro: 'Use a correct phone number and email so owners and tenants can communicate smoothly.',
  },
  {
    q: '5. How can I use the chat assistance?',
    intro: 'Chat assistance can help you:',
    bullets: [
      'Get guidance on listing properties',
      'Understand premium services',
      'Find suitable properties',
      'Solve account-related issues',
    ],
    outro: 'To use it:',
    extraBullets: [
      'Click the Chat icon on the website',
      'Type your question',
      'Follow the support response in chat',
    ],
    note: 'Chat assistance does not replace direct communication between owners and tenants.',
  },
  {
    q: '6. How can I search and filter properties?',
    intro: 'Tenants can search and filter properties by:',
    bullets: [
      'Location / Area',
      'Budget range',
      'Property type (Family / Bachelor / Office)',
      'Number of bedrooms',
      'Availability date',
    ],
    outro:
      'Enter your preferences in the search bar, apply filters, then view property details and contact the owner directly.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">RentNao</Link>
          <nav className="flex gap-6">
            <Link to="/about" className="text-sm text-gray-600 hover:text-teal-700">About</Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-teal-700">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions (FAQ)</h1>
        <div className="space-y-6">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{item.q}</h2>
              {item.intro ? <p className="text-gray-600 text-sm">{item.intro}</p> : null}
              {Array.isArray(item.bullets) && item.bullets.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-600 text-sm">
                  {item.bullets.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {item.outro ? <p className="mt-2 text-gray-600 text-sm">{item.outro}</p> : null}
              {Array.isArray(item.extraBullets) && item.extraBullets.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-600 text-sm">
                  {item.extraBullets.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {item.note ? <p className="mt-2 text-gray-600 text-sm">{item.note}</p> : null}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

