import { useState, useEffect } from 'react';
import { getSessionId } from '../services/api';

const GRADE_COLORS = {
  A: 'text-green-700',
  B: 'text-blue-700',
  C: 'text-orange-700',
  D: 'text-red-700',
};

const ACTION_COLORS = {
  resell: 'bg-blue-500',
  refurbish: 'bg-yellow-500',
  donate: 'bg-purple-500',
  recycle: 'bg-green-500',
};

const ACTION_ICONS = {
  resell: '🏷️',
  refurbish: '🔧',
  donate: '🎁',
  recycle: '♻️',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);

    const sessionId = getSessionId();

    try {
      const res = await fetch('/api/dashboard', {
        headers: { 'x-session-id': sessionId },
      });

      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-green-600 mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalActions = Object.values(data.action_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🌍 Sustainability Dashboard</h2>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Green Credits"
          value={data.total_green_credits}
          icon="🌱"
          color="bg-green-50 border-green-200"
        />
        <MetricCard
          label="Products Assessed"
          value={data.total_assessments}
          icon="📦"
          color="bg-blue-50 border-blue-200"
        />
        <MetricCard
          label="CO₂ Saved"
          value={`${data.total_co2_saved_kg.toFixed(1)} kg`}
          icon="🌍"
          color="bg-emerald-50 border-emerald-200"
        />
      </div>

      {/* Action Distribution */}
      {totalActions > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Action Distribution</h3>

          {/* Bar Chart */}
          <div className="space-y-3">
            {Object.entries(data.action_distribution).map(([action, count]) => {
              const pct = totalActions > 0 ? (count / totalActions) * 100 : 0;
              return (
                <div key={action} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-gray-600 capitalize">
                    {ACTION_ICONS[action] || ''} {action}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ACTION_COLORS[action] || 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-500 text-right">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Assessments */}
      {data.recent_assessments && data.recent_assessments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Assessments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Grade</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_assessments.map((item) => (
                  <tr key={item.assessment_id} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-800">{item.product_category}</td>
                    <td className={`py-2 font-bold ${GRADE_COLORS[item.condition_grade] || 'text-gray-800'}`}>
                      {item.condition_grade}
                    </td>
                    <td className="py-2 capitalize text-gray-700">
                      {ACTION_ICONS[item.action_recommendation] || ''} {item.action_recommendation}
                    </td>
                    <td className="py-2 text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.total_assessments === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-lg">No assessments yet.</p>
          <p className="text-sm mt-1">Upload a product to see your sustainability impact here.</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, color }) {
  return (
    <div className={`border rounded-xl p-5 ${color}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">
        {icon} {value}
      </p>
    </div>
  );
}
