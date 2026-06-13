import { useState } from 'react';
import { uploadImage, assessProduct } from '../services/api';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Furniture',
  'Books',
  'Toys',
  'Appliances',
  'Sports Equipment',
];

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-orange-100 text-orange-800 border-orange-300',
  D: 'bg-red-100 text-red-800 border-red-300',
};

const GRADE_LABELS = {
  A: 'Like New',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
};

export default function UploadPage() {
  // Form state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [price, setPrice] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
      setError(null);
    }
  }

  function resetForm() {
    setFile(null);
    setPreview(null);
    setCategory('');
    setAgeMonths('');
    setPrice('');
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Client-side validation
    if (!file) return setError('Please select an image file.');
    if (!category) return setError('Please select a product category.');
    if (!ageMonths || Number(ageMonths) < 0 || Number(ageMonths) > 240)
      return setError('Product age must be between 0 and 240 months.');
    if (!price || Number(price) <= 0)
      return setError('Original price must be greater than 0.');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type))
      return setError('File must be JPEG, PNG, or WebP format.');
    if (file.size > 10 * 1024 * 1024)
      return setError('File size must be under 10 MB.');

    setLoading(true);

    try {
      // Step 1: Upload image
      const uploadRes = await uploadImage(file);

      // Step 2: Run assessment
      const assessment = await assessProduct({
        image_key: uploadRes.image_key,
        product_category: category,
        product_age_months: Number(ageMonths),
        original_price: Number(price),
      });

      setResult(assessment);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input').click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Product preview"
                className="max-h-64 mx-auto rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Drop your product image here</p>
                <p className="text-sm mt-1">or click to browse (JPEG, PNG, WebP — max 10MB)</p>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Age (months)
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
                placeholder="e.g. 18"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price ($)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 599.99"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing product...
              </span>
            ) : (
              '🌱 Assess Product'
            )}
          </button>
        </form>
      ) : (
        /* Results Display */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Assessment Results</h2>
            <button
              onClick={resetForm}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Assess Another Product
            </button>
          </div>

          {/* Condition Grade */}
          <div className={`border rounded-xl p-6 ${GRADE_COLORS[result.condition_grade]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">Condition Grade</p>
                <p className="text-3xl font-bold">
                  {result.condition_grade} — {GRADE_LABELS[result.condition_grade]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-75">Confidence</p>
                <p className="text-2xl font-bold">{result.confidence_score}%</p>
              </div>
            </div>
            <p className="mt-3 text-sm opacity-80">{result.grade_explanation}</p>
          </div>

          {/* Action + Value + Credits Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Recommendation */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Recommended Action</p>
              <p className="text-xl font-bold text-gray-800 capitalize mt-1">
                {result.action_recommendation === 'resell' && '🏷️ '}
                {result.action_recommendation === 'refurbish' && '🔧 '}
                {result.action_recommendation === 'donate' && '🎁 '}
                {result.action_recommendation === 'recycle' && '♻️ '}
                {result.action_recommendation}
              </p>
              <p className="text-xs text-gray-500 mt-2">{result.action_reasoning}</p>
            </div>

            {/* Resale Value */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Estimated Resale Value</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {result.resale_value.display}
              </p>
            </div>

            {/* Green Credits + CO2 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-green-700 font-medium">Sustainability Impact</p>
              <p className="text-xl font-bold text-green-800 mt-1">
                🌱 {result.green_credits} credits
              </p>
              <p className="text-sm text-green-600 mt-1">
                🌍 {result.co2_savings_kg} kg CO₂ saved
              </p>
            </div>
          </div>

          {/* Buyer Personas */}
          {result.buyer_personas && result.buyer_personas.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Suggested Buyer Personas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.buyer_personas.map((persona, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-800">{persona.label}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {persona.relevance_score}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{persona.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
