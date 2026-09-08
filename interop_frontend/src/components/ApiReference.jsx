import React, { useState } from 'react';
import axios from 'axios';
import { BookOpen, Code, Play, RefreshCw, Copy, Check, Sparkles, Terminal, Shield, Key, ChevronRight, Search } from 'lucide-react';
import { SERVER_URL as API_BASE } from '../config';

export default function ApiReference() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [activeLang, setActiveLang] = useState('curl');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [authHeaderMode, setAuthHeaderMode] = useState('BEARER'); // 'BEARER' | 'API_KEY' | 'NONE'
  const [requestBodyText, setRequestBodyText] = useState('');

  const categories = [
    { id: 'ALL', name: 'All Endpoints' },
    { id: 'AUTH', name: 'Authentication (OAuth 2.0)' },
    { id: 'FHIR', name: 'HL7 FHIR R4 Resources' },
    { id: 'REST', name: 'REST Healthcare APIs' },
    { id: 'SANDBOX', name: 'Sandbox & Utilities' }
  ];

  const endpoints = [
    {
      category: 'AUTH',
      type: 'REST',
      method: 'POST',
      path: '/api/v1/auth/token',
      summary: 'OAuth 2.0 Token Exchange',
      desc: 'Exchanges client_id and client_secret for a signed JWT access token.',
      defaultBody: {
        grant_type: 'client_credentials',
        client_id: 'cli_apollo_metro_981273',
        client_secret: 'sec_demo'
      }
    },
    {
      category: 'FHIR',
      type: 'FHIR',
      method: 'GET',
      path: '/fhir/Patient',
      summary: 'Search Patients (FHIR R4)',
      desc: 'Retrieves a searchset Bundle of FHIR Patient resources matching criteria.',
      sampleParams: '?name=Rahul'
    },
    {
      category: 'FHIR',
      type: 'FHIR',
      method: 'GET',
      path: '/fhir/Patient/Patient-Rahul-Verma/$everything',
      summary: 'Export $everything Bundle',
      desc: 'Aggregates complete clinical history (Vitals, Diagnoses, Prescriptions, Encounters) into a single searchset Bundle.',
      sampleUrl: '/fhir/Patient/Patient-Rahul-Verma/$everything'
    },
    {
      category: 'FHIR',
      type: 'FHIR',
      method: 'POST',
      path: '/fhir/Patient',
      summary: 'Ingest Patient (FHIR R4)',
      desc: 'Ingests a new HL7 FHIR R4 Patient JSON resource into the platform.',
      defaultBody: {
        resourceType: 'Patient',
        id: 'Patient-Kavita-Roy',
        name: [{ use: 'official', text: 'Kavita Roy', family: 'Roy', given: ['Kavita'] }],
        gender: 'female',
        birthDate: '1992-06-15',
        telecom: [{ system: 'phone', value: '+91-9811223344' }]
      }
    },
    {
      category: 'FHIR',
      type: 'FHIR',
      method: 'GET',
      path: '/fhir/Observation',
      summary: 'Query LOINC Observations',
      desc: 'Query vital signs, lab metrics, and diagnostic observations by LOINC code.',
      sampleParams: '?code=8867-4'
    },
    {
      category: 'REST',
      type: 'REST',
      method: 'GET',
      path: '/api/v1/patients',
      summary: 'List High-Level Patients',
      desc: 'Simplified REST response tailored for quick mobile & web integration.'
    },
    {
      category: 'SANDBOX',
      type: 'REST',
      method: 'POST',
      path: '/api/v1/sandbox/seed',
      summary: 'Seed Synthetic Hospital Data',
      desc: 'Populates database partitions with synthetic FHIR patients, encounters, and vital signs.'
    }
  ];

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesCat = selectedCategory === 'ALL' || ep.category === selectedCategory;
    const matchesQuery = ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || ep.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const currentEp = filteredEndpoints[selectedEndpointIndex] || endpoints[0];

  const generateSnippet = (lang, ep) => {
    const fullUrl = `${API_BASE}${ep.sampleUrl || ep.path}${ep.sampleParams || ''}`;
    const headers = authHeaderMode === 'BEARER' ? { 'Authorization': 'Bearer eyJhbGci...' } :
                    authHeaderMode === 'API_KEY' ? { 'X-API-Key': 'mtk_live_992100812' } : {};
    
    headers['X-Organization-ID'] = 'org_apollo_metro';
    if (ep.method === 'POST' || ep.method === 'PUT') {
      headers['Content-Type'] = 'application/json';
    }

    if (lang === 'curl') {
      let hStr = Object.entries(headers).map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ');
      let bodyStr = (ep.method === 'POST' || ep.method === 'PUT') ? ` \\\n  -d '${JSON.stringify(ep.defaultBody || {}, null, 2)}'` : '';
      return `curl -X ${ep.method} "${fullUrl}" \\\n  ${hStr}${bodyStr}`;
    }

    if (lang === 'javascript') {
      return `const response = await fetch("${fullUrl}", {\n  method: "${ep.method}",\n  headers: ${JSON.stringify(headers, null, 4)}${ep.method !== 'GET' ? `,\n  body: JSON.stringify(${JSON.stringify(ep.defaultBody || {}, null, 4)})` : ''}\n});\nconst data = await response.json();\nconsole.log(data);`;
    }

    if (lang === 'python') {
      return `import requests\n\nurl = "${fullUrl}"\nheaders = ${JSON.stringify(headers, null, 4)}\n${ep.method !== 'GET' ? `data = ${JSON.stringify(ep.defaultBody || {}, null, 4)}\nresponse = requests.${ep.method.toLowerCase()}(url, headers=headers, json=data)` : `response = requests.${ep.method.toLowerCase()}(url, headers=headers)`}\n\nprint(response.json())`;
    }

    return `// ${lang} SDK snippet`;
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const fullUrl = `${API_BASE}${currentEp.sampleUrl || currentEp.path}${currentEp.sampleParams || ''}`;
      const headers = {
        'X-Organization-ID': 'org_apollo_metro'
      };
      if (authHeaderMode === 'BEARER') headers['Authorization'] = 'Bearer demo_token';

      let res;
      if (currentEp.method === 'GET') {
        res = await axios.get(fullUrl, { headers });
      } else {
        const bodyData = requestBodyText ? JSON.parse(requestBodyText) : (currentEp.defaultBody || {});
        res = await axios.post(fullUrl, bodyData, { headers });
      }
      setResponseTime(Date.now() - start);
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data
      });
    } catch (err) {
      setResponseTime(Date.now() - start);
      setResponse({
        status: err.response ? err.response.status : 500,
        statusText: err.response ? err.response.statusText : 'Internal Error',
        headers: err.response ? err.response.headers : {},
        data: err.response ? err.response.data : { message: err.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySnippet = () => {
    const text = generateSnippet(activeLang, currentEp);
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-xs font-semibold text-[#a6f120] mb-2 font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Master API Documentation & Live Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Interactive REST & HL7 FHIR API Reference</h1>
          <p className="text-sm text-white/60 mt-1">
            Test platform endpoints live directly from your browser with full request/response inspectors and multi-language SDK code generators.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 bg-[#020d09] border border-white/15 rounded-xl text-xs font-mono text-white/80">
            Base URL: <span className="text-[#a6f120] font-bold">{API_BASE}</span>
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex overflow-x-auto gap-2 scrollbar-none py-1 font-mono">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedCategory(c.id); setSelectedEndpointIndex(0); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#a6f120] text-[#062319] font-bold shadow-md shadow-[#a6f120]/20'
                  : 'bg-[#041912] border border-white/10 text-white/70 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search API endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#020d09] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#a6f120]"
          />
        </div>
      </div>

      {/* Split Panel: Sidebar + Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Endpoint Navigation Sidebar */}
        <div className="lg:col-span-5 space-y-2">
          {filteredEndpoints.map((ep, idx) => {
            const isSelected = selectedEndpointIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedEndpointIndex(idx)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#062c1f] border-[#a6f120]/50 shadow-xl ring-1 ring-[#a6f120]/30'
                    : 'bg-[#041912] border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded ${
                      ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      ep.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      ep.method === 'PUT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-bold text-white truncate">{ep.path}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-[#a6f120] translate-x-0.5' : 'text-white/40'}`} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-white/80 font-medium truncate font-display">{ep.summary}</span>
                  <span className="text-[10px] font-mono text-white/50 bg-[#020d09] px-1.5 py-0.5 rounded border border-white/10">{ep.type}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Main Console & Code Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#041912] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header & Execute CTA */}
            <div className="px-6 py-5 bg-[#020d09] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 text-xs font-mono font-extrabold rounded ${
                    currentEp.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {currentEp.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">{currentEp.sampleUrl || currentEp.path}{currentEp.sampleParams || ''}</span>
                </div>
                <p className="text-xs text-white/60">{currentEp.desc}</p>
              </div>

              <button
                onClick={handleExecuteRequest}
                disabled={loading}
                className="px-5 py-2.5 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-extrabold text-xs rounded-full flex items-center space-x-2 shadow-lg shadow-[#a6f120]/20 transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-[#062319]" />}
                <span>Send Request</span>
              </button>
            </div>

            {/* Auth Header Selector */}
            <div className="px-6 py-3 bg-[#020d09]/60 border-b border-white/10 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2 text-white/60">
                <Shield className="h-3.5 w-3.5 text-[#a6f120]" />
                <span>Authorization Header Mode:</span>
              </div>
              <div className="flex items-center space-x-1">
                {[
                  { id: 'BEARER', label: 'Bearer JWT' },
                  { id: 'API_KEY', label: 'API Key (mtk_)' },
                  { id: 'NONE', label: 'None (Public)' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAuthHeaderMode(m.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      authHeaderMode === m.id
                        ? 'bg-[#a6f120]/20 text-[#a6f120] border border-[#a6f120]/40 font-bold'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Code Snippet Tabs */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  {['curl', 'javascript', 'python'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                        activeLang === lang
                          ? 'bg-[#a6f120] text-[#062319]'
                          : 'text-white/60 hover:text-white bg-white/5'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopySnippet}
                  className="px-3 py-1 bg-white/5 hover:bg-white/15 text-white/80 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedSnippet ? <Check className="h-3.5 w-3.5 text-[#a6f120]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Code Display Box */}
              <div className="bg-[#020d09] p-4 rounded-2xl border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
                <pre className="text-slate-200">
                  <code>{generateSnippet(activeLang, currentEp)}</code>
                </pre>
              </div>

              {/* Response Inspector */}
              {response && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">Live Execution Response</span>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${response.status === 200 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="text-white/50 text-[11px]">{responseTime}ms</span>
                    </div>
                  </div>

                  <div className="bg-[#020d09] p-4 rounded-2xl border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[300px]">
                    <pre className="text-slate-200">
                      <code>{JSON.stringify(response.data, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
