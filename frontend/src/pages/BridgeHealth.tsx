import React, { useState } from 'react';
import { 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  TrendingDown, 
  ShieldAlert, 
  Calculator,
  ArrowRight,
  Info
} from 'lucide-react';
import { BridgePredictionRequest, BridgePredictionResponse } from '../types';
import { api } from '../services/api';

export const BridgeHealth: React.FC = () => {
  const [age, setAge] = useState<number>(28);
  const [material, setMaterial] = useState<string>('Concrete');
  const [spanLength, setSpanLength] = useState<number>(45.0);
  const [trafficLoad, setTrafficLoad] = useState<number>(18500);
  const [maintenanceLevel, setMaintenanceLevel] = useState<string>('Fair');
  const [environment, setEnvironment] = useState<string>('Moderate');
  const [cracks, setCracks] = useState<string>('Moderate');
  const [corrosion, setCorrosion] = useState<number>(4);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BridgePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: BridgePredictionRequest = {
      age,
      material,
      span_length: spanLength,
      traffic_load: trafficLoad,
      maintenance_level: maintenanceLevel,
      environmental_conditions: environment,
      cracks_detected: cracks,
      corrosion_level: corrosion,
    };

    try {
      const res = await api.predictBridgeLife(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Bridge life model inference failed.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'CRITICAL':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MEDIUM RISK</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW RISK</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-10 pb-16">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold mb-2">
          <Cpu className="w-3.5 h-3.5" />
          XGBoost Machine Learning Regression Model
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Bridge Structural Lifespan Predictor</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Evaluates structural degradation using a trained XGBoost Regressor model over 9 critical engineering parameters including Average Daily Traffic (ADT), material delamination, and corrosion.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Input Form & Real Model Inference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Form Inputs (2 Columns) */}
        <form onSubmit={handlePredict} className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            Structural & Traffic Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Age */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase">Structure Age</span>
                <span className="text-white font-mono">{age} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Span Length */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase">Span Length</span>
                <span className="text-white font-mono">{spanLength} m</span>
              </div>
              <input
                type="range"
                min={10}
                max={250}
                value={spanLength}
                onChange={(e) => setSpanLength(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Daily Traffic */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Daily Traffic (ADT)</label>
              <input
                type="number"
                min={500}
                max={150000}
                value={trafficLoad}
                onChange={(e) => setTrafficLoad(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Material */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Material Type</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Concrete">Reinforced Concrete</option>
                <option value="Steel">Structural Steel</option>
                <option value="Composite">Steel-Concrete Composite</option>
                <option value="Prestressed Concrete">Prestressed Concrete</option>
              </select>
            </div>

            {/* Maintenance Level */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Historical Maintenance</label>
              <select
                value={maintenanceLevel}
                onChange={(e) => setMaintenanceLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Excellent">Excellent (Annual Preventive Maintenance)</option>
                <option value="Good">Good (Regular Inspections)</option>
                <option value="Fair">Fair (Reactive Maintenance Only)</option>
                <option value="Poor">Poor (Deferred Maintenance)</option>
              </select>
            </div>

            {/* Environmental Conditions */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Environment Exposure</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Mild">Mild Inland (Low Moisture)</option>
                <option value="Moderate">Moderate Temperate</option>
                <option value="Severe">Severe Freeze-Thaw / De-icing Salts</option>
                <option value="Marine">Marine Coastal (High Salinity)</option>
              </select>
            </div>

            {/* Cracks Detected */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Observed Surface Cracking</label>
              <select
                value={cracks}
                onChange={(e) => setCracks(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="None">None (Intact Deck & Girders)</option>
                <option value="Minor">Minor Hairline Cracks (&lt; 0.5mm)</option>
                <option value="Moderate">Moderate Flexural Cracking</option>
                <option value="Severe">Severe Structural Spalling</option>
              </select>
            </div>

            {/* Corrosion Level */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase">Corrosion Index (0-10)</span>
                <span className="text-white font-mono">{corrosion}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={corrosion}
                onChange={(e) => setCorrosion(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Cpu className="w-4 h-4" />
            {loading ? 'Evaluating XGBoost Regressor...' : 'Calculate Remaining Lifespan'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Prediction Output Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Model Prediction Output
          </h3>

          {result ? (
            <div className="space-y-6">
              <div className="text-center p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs uppercase font-semibold text-slate-400">Estimated Remaining Lifespan</span>
                <div className="text-4xl font-black text-white">
                  {result.predicted_remaining_life_years.toFixed(1)} <span className="text-lg text-cyan-400 font-normal">Years</span>
                </div>
                <div className="pt-2">{getRiskBadge(result.risk_category)}</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Degradation Index</span>
                  <span className="text-white font-bold font-mono">{result.degradation_index.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      result.degradation_index > 70 ? 'bg-red-500' :
                      result.degradation_index > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, result.degradation_index)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white block mb-1">Structural Assessment:</strong>
                {result.explanation}
              </div>

              <div className="text-[10px] text-slate-500 flex items-start gap-1.5 leading-normal">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>{result.disclaimer}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-600 space-y-3">
              <Layers className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-xs">Adjust bridge parameters and click calculate to run inference.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

