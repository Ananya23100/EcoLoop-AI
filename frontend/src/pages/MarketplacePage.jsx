import { useState, useEffect } from 'react';
import { getSessionId } from '../services/api';

const GRADE_BADGE = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-orange-100 text-orange-800',
  D: 'bg-red-100 text-red-800',
};
const GRADE_LABEL = { A: 'Like New', B: 'Good', C: 'Fair', D: 'Poor' };

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [interestSent, setInterestSent] = useState(false);
  const [profile, setProfile] = useState(null); // sustainability profile data

  useEffect(() => { fetchListings(); fetchProfile(); }, [activeTab]);

  async function fetchListings() {
    setLoading(true);
    try {
      const query = activeTab !== 'all' ? `?listing_type=${activeTab}` : '';
      const res = await fetch(`/api/listings${query}`);
      if (res.ok) { const data = await res.json(); setListings(data.listings || []); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function fetchProfile() {
    try {
      const res = await fetch('/api/dashboard', { headers: { 'x-session-id': getSessionId() } });
      if (res.ok) setProfile(await res.json());
    } catch { /* silent */ }
  }

  function openDetail(listing) { setSelected(listing); setInterestSent(false); }
  function closeDetail() { setSelected(null); setInterestSent(false); }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 EcoLoop Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">AI-verified second-life products ready for new owners</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-full">
          {listings.length} Active Listings
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>All</TabButton>
        <TabButton active={activeTab === 'resale'} onClick={() => setActiveTab('resale')}>🏷️ Resale</TabButton>
        <TabButton active={activeTab === 'refurbished'} onClick={() => setActiveTab('refurbished')}>🔧 Refurbished</TabButton>
        <TabButton active={activeTab === 'donation'} onClick={() => setActiveTab('donation')}>❤️ Donations</TabButton>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-72 animate-pulse" />)}
        </div>
      )}

      {/* Listings Grid */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} onClick={() => openDetail(listing)} />
          ))}
        </div>
      )}

      {/* Recommended For You — shows refurbished listings from matching categories */}
      {!loading && listings.length > 1 && (
        <RecommendedSection listings={listings} onSelect={openDetail} profile={profile} />
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-5xl block mb-4">🏪</span>
          <p className="text-lg font-bold text-gray-700">No listings yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Assess a product and list it for resale or refurbishment.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#0f1b2d] font-bold px-6 py-3 rounded-xl transition-all shadow-md">
            🌱 Assess a Product
          </a>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <ListingDetailModal
          listing={selected}
          onClose={closeDetail}
          interestSent={interestSent}
          onInterest={() => setInterestSent(true)}
          profile={profile}
        />
      )}
    </div>
  );
}

/* =============== Components =============== */

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  );
}

function ListingCard({ listing, onClick }) {
  const snapshot = listing.assessment_snapshot || {};
  const personas = listing.buyer_personas || [];
  const gradeBadge = GRADE_BADGE[listing.condition_grade] || GRADE_BADGE.C;

  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
      {/* Image */}
      <div className="relative h-44 bg-gray-200 overflow-hidden">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📦</div>
        )}
        {listing.ai_verified && (
          <span className="absolute top-3 left-3 bg-[#0f1b2d]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ AI Verified</span>
        )}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${listing.listing_type === 'resale' ? 'bg-blue-500 text-white' : listing.listing_type === 'donation' ? 'bg-pink-500 text-white' : 'bg-amber-500 text-white'}`}>
          {listing.listing_type === 'resale' ? '🏷️ Resale' : listing.listing_type === 'donation' ? '❤️ Donation' : '🔧 Refurbished'}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{listing.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{listing.product_category}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${gradeBadge}`}>
            Grade {listing.condition_grade}
          </span>
        </div>

        <div className="mt-3">
          {listing.listing_type === 'donation' ? (
            <p className="text-sm font-semibold text-pink-700">❤️ Free — Community Donation</p>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-900">${listing.suggested_price?.toFixed(0)}</p>
              <p className="text-[10px] text-gray-400">Range: ${listing.price_min?.toFixed(0)} - ${listing.price_max?.toFixed(0)}</p>
            </>
          )}
        </div>

        {snapshot.green_credits && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">🌱 {snapshot.green_credits} credits</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">🌍 {snapshot.co2_savings_kg} kg CO₂</span>
          </div>
        )}

        {listing.listing_type !== 'donation' && personas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {personas.slice(0, 3).map((p, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✓ {p.label}</span>
            ))}
          </div>
        )}

        {listing.listing_type === 'donation' && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] font-semibold text-pink-700">Donation Impact:</p>
            <p className="text-[10px] text-pink-600">• Partner NGOs, Schools, Community Orgs</p>
            <p className="text-[10px] text-pink-600">• Est. 3-5 beneficiaries reached</p>
          </div>
        )}

        <p className="text-[10px] text-gray-300 mt-3">
          Listed {listing.created_at ? new Date(listing.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        </p>

        {/* View Details CTA */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-semibold text-[#f59e0b] group-hover:text-[#d97706] transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
}

function ListingDetailModal({ listing, onClose, interestSent, onInterest, profile }) {
  const snapshot = listing.assessment_snapshot || {};
  const personas = listing.buyer_personas || [];
  const gradeBadge = GRADE_BADGE[listing.condition_grade] || GRADE_BADGE.C;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors">
          ✕
        </button>

        {/* Image */}
        <div className="relative h-64 bg-gray-200 rounded-t-3xl overflow-hidden">
          {listing.image_url ? (
            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain p-3" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">📦</div>
          )}
          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {listing.ai_verified && (
              <span className="bg-[#0f1b2d]/90 text-white text-xs font-bold px-3 py-1.5 rounded-full">✓ AI Verified</span>
            )}
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${listing.listing_type === 'resale' ? 'bg-blue-500 text-white' : listing.listing_type === 'donation' ? 'bg-pink-500 text-white' : 'bg-amber-500 text-white'}`}>
              {listing.listing_type === 'resale' ? '🏷️ Resale' : listing.listing_type === 'donation' ? '❤️ Donation' : '🔧 Refurbished'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{listing.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{listing.product_category}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${gradeBadge}`}>
              Grade {listing.condition_grade} — {GRADE_LABEL[listing.condition_grade] || ''}
            </span>
          </div>

          {/* AI Description */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI-Generated Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
          </div>

          {/* Price Section — hidden for donations */}
          {listing.listing_type !== 'donation' ? (
            <div className="flex items-end gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-400">Suggested Price</p>
                <p className="text-3xl font-bold text-gray-900">${listing.suggested_price?.toFixed(0)}</p>
              </div>
              <div className="pb-1">
                <p className="text-xs text-gray-400">Price Range</p>
                <p className="text-sm font-medium text-gray-600">${listing.price_min?.toFixed(0)} — ${listing.price_max?.toFixed(0)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-bold text-pink-800">❤️ Community Donation</p>
              <p className="text-xs text-pink-600 mt-1">
                This item will be routed through EcoLoop partner NGOs, schools, community organizations, and donation networks to maximize social and environmental impact.
              </p>
            </div>
          )}

          {/* Impact Destination — for donations */}
          {listing.listing_type === 'donation' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Impact Destinations</p>
              <div className="grid grid-cols-2 gap-3">
                <DestinationCard icon="🏫" label="Schools" desc="Educational institutions in need" />
                <DestinationCard icon="🤝" label="NGOs" desc="Non-profit community organizations" />
                <DestinationCard icon="🏘️" label="Community Centers" desc="Local neighborhood centers" />
                <DestinationCard icon="👨‍👩‍👧‍👦" label="Low-income Families" desc="Families in underserved areas" />
              </div>
            </div>
          )}

          {/* Sustainability Impact */}
          {(snapshot.green_credits || snapshot.co2_savings_kg) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-5 border border-green-100">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Sustainability Impact</p>
              <div className="flex items-center gap-4">
                <span className="text-sm bg-white text-green-800 font-semibold px-3 py-1.5 rounded-full border border-green-200">
                  🌱 {snapshot.green_credits} Green Credits
                </span>
                <span className="text-sm bg-white text-emerald-800 font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                  🌍 {snapshot.co2_savings_kg} kg CO₂ Saved
                </span>
              </div>
            </div>
          )}

          {/* Buyer Personas — hidden for donations */}
          {listing.listing_type !== 'donation' && personas.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recommended For</p>
              <div className="flex flex-wrap gap-2">
                {personas.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-[#0f1b2d]/5 text-gray-700 font-medium px-3 py-1.5 rounded-full border border-gray-200">
                    <span className="text-green-600">✓</span> {p.label}
                    {p.relevance_score && <span className="text-[10px] text-gray-400 ml-1">{p.relevance_score}/10</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400 mb-6">
            Listed {listing.created_at ? new Date(listing.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
          </p>

          {/* Purchase Confidence — Buyer-focused return prevention */}
          <PurchaseConfidenceCard listing={listing} snapshot={snapshot} profile={profile} />

          {/* CTA */}
          <div className="border-t border-gray-100 pt-5">
            {interestSent ? (
              <div className="text-center py-3 bg-green-50 rounded-xl border border-green-200">
                <span className="text-2xl block mb-1">✅</span>
                <p className="text-sm font-bold text-green-800">
                  {listing.listing_type === 'donation' ? 'Donation Interest Registered!' : 'Interest Registered!'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {listing.listing_type === 'donation'
                    ? 'A community partner will be matched with this item.'
                    : 'The seller will be notified of your interest.'}
                </p>
              </div>
            ) : (
              <button
                onClick={onInterest}
                className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2 ${
                  listing.listing_type === 'donation'
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : 'bg-[#f59e0b] hover:bg-[#d97706] text-[#0f1b2d]'
                }`}
              >
                {listing.listing_type === 'donation' ? '❤️ Request Donation' : '💬 Interested in this Product'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DestinationCard({ icon, label, desc }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

function RecommendedSection({ listings, onSelect, profile }) {
  // Derive user preferences from profile
  const actionDist = profile?.action_distribution || {};
  const recentAssessments = profile?.recent_assessments || [];

  // Compute top category from recent assessments
  const catCounts = {};
  recentAssessments.forEach((a) => { if (a.product_category) catCounts[a.product_category] = (catCounts[a.product_category] || 0) + 1; });
  const topCategory = Object.entries(catCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || '';

  // Compute top action
  const topAction = Object.entries(actionDist).sort(([,a],[,b]) => b - a)[0]?.[0] || '';

  // Score each listing based on profile match
  // Priority: 1. Category match (+10) 2. Action match (+5) 3. Refurbished boost (+3) 4. Higher sustainability (+1) 5. Newer (+0.5)
  const scored = listings.map((item) => {
    let score = 0;
    const snapshot = item.assessment_snapshot || {};

    // 1. Category match with user's most assessed category
    if (item.product_category === topCategory) score += 10;

    // 2. Listing type match with user's most frequent action
    const listingAction = item.listing_type === 'resale' ? 'resell' : item.listing_type === 'refurbished' ? 'refurbish' : 'donate';
    if (listingAction === topAction) score += 5;

    // 3. Refurbished boost
    if (item.listing_type === 'refurbished') score += 3;

    // 4. Higher sustainability impact
    score += (snapshot.green_credits || 0) * 0.1;

    // 5. More recent
    if (item.created_at) score += 0.5;

    // Determine recommendation reason
    let reason = '';
    if (item.product_category === topCategory) {
      reason = `Recommended because you frequently assess ${topCategory} products`;
    } else if (listingAction === topAction) {
      reason = `Recommended because you often choose ${topAction} actions`;
    } else if (item.listing_type === 'refurbished') {
      reason = 'Recommended: refurbished products have high sustainability impact';
    } else {
      reason = 'Recommended based on your sustainability profile';
    }

    return { ...item, _score: score, _reason: reason };
  });

  // Sort by score descending and take top 3
  scored.sort((a, b) => b._score - a._score);
  const recommended = scored.slice(0, 3);

  if (recommended.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Recommended For You</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recommended.map((item) => (
          <div
            key={item.listing_id}
            onClick={() => onSelect(item)}
            className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{item.listing_type === 'donation' ? '❤️ Free' : `$${item.suggested_price?.toFixed(0)}`}</p>
                <p className="text-[10px] text-[#f59e0b] font-medium mt-0.5">View Details →</p>
              </div>
            </div>
            {/* Recommendation reason */}
            <p className="text-[9px] text-gray-400 italic leading-tight">{item._reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchaseConfidenceCard({ listing, snapshot, profile }) {
  // === Purchase Confidence Formula ===
  // Base: confidence_score from AI assessment
  // Grade modifier: A=+10, B=+5, C=-10, D=-25
  // AI Verified: +5
  // Category match with user profile: +5
  // Action match with user profile: +3
  // Clamp 0-100

  const GRADE_MOD = { A: 10, B: 5, C: -10, D: -25 };
  const baseConfidence = snapshot.confidence_score || 70;
  const gradeMod = GRADE_MOD[listing.condition_grade] || 0;
  const aiVerifiedMod = listing.ai_verified ? 5 : 0;

  // Profile-based personalization
  const recentAssessments = profile?.recent_assessments || [];
  const catCounts = {};
  recentAssessments.forEach((a) => { if (a.product_category) catCounts[a.product_category] = (catCounts[a.product_category] || 0) + 1; });
  const topCategory = Object.entries(catCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || '';
  const topAction = Object.entries(profile?.action_distribution || {}).sort(([,a],[,b]) => b - a)[0]?.[0] || '';

  const categoryMatchMod = listing.product_category === topCategory ? 5 : 0;
  const listingAction = listing.listing_type === 'resale' ? 'resell' : listing.listing_type === 'refurbished' ? 'refurbish' : 'donate';
  const actionMatchMod = listingAction === topAction ? 3 : 0;

  const rawScore = baseConfidence + gradeMod + aiVerifiedMod + categoryMatchMod + actionMatchMod;
  const purchaseConfidence = Math.max(0, Math.min(100, rawScore));

  // === Return Risk from Purchase Confidence ===
  const returnRisk = purchaseConfidence >= 90 ? { level: 'Very Low', color: 'bg-green-100 text-green-800' }
    : purchaseConfidence >= 75 ? { level: 'Low', color: 'bg-emerald-100 text-emerald-800' }
    : purchaseConfidence >= 60 ? { level: 'Medium', color: 'bg-amber-100 text-amber-800' }
    : purchaseConfidence >= 40 ? { level: 'High', color: 'bg-orange-100 text-orange-800' }
    : { level: 'Very High', color: 'bg-red-100 text-red-800' };

  // === Explainability ===
  const explanations = [];
  if (categoryMatchMod > 0) explanations.push(`Recommended because ${topCategory} is your most assessed category.`);
  if (actionMatchMod > 0) explanations.push(`Matches your preferred action: ${topAction}.`);
  if (listing.ai_verified) explanations.push('AI-verified condition assessment increases confidence.');
  if (gradeMod >= 5) explanations.push('Strong product condition supports low return risk.');
  if (gradeMod < 0) explanations.push('Lower condition grade increases return probability.');
  if (explanations.length === 0) explanations.push('Purchase confidence based on AI assessment and product condition.');

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">🛡️ Purchase Confidence</h4>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${returnRisk.color}`}>
          {returnRisk.level} Return Risk
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/70 rounded-lg p-3 text-center border border-blue-100">
          <p className="text-xl font-bold text-blue-900">{purchaseConfidence}%</p>
          <p className="text-[9px] text-blue-600">Confidence</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center border border-blue-100">
          <p className="text-xl font-bold text-blue-900">{returnRisk.level}</p>
          <p className="text-[9px] text-blue-600">Return Risk</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center border border-blue-100">
          <p className="text-xl font-bold text-blue-900">{listing.ai_verified ? '✓ Yes' : 'No'}</p>
          <p className="text-[9px] text-blue-600">AI Verified</p>
        </div>
      </div>

      {/* Explainability */}
      <div className="space-y-1">
        {explanations.map((e, i) => (
          <p key={i} className="text-[10px] text-blue-700 flex items-start gap-1.5">
            <span className="mt-0.5">💡</span> {e}
          </p>
        ))}
      </div>
    </div>
  );
}
