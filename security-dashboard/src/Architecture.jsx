import React, { useState, useEffect } from 'react';

// --- CONSTANTS ---
const C = {
  bg:       "#05060e",
  bgPanel:  "#080a14",
  bgCard:   "#0b0d1c",
  border:   "#141630",
  borderHi: "#1e2248",
  text:     "#c8ccf0",
  muted:    "#5a5e8a",
  dim:      "#2a2d52",
  threat:   "#ff2d55",
  net:      "#00c8ff",
  identity: "#ff9500",
  ai:       "#bf5af2",
  detect:   "#30d158",
  chain:    "#ffd60a",
  core:     "#0a84ff",
};

const THREAT_PILLS = [
  "🤖 AI-Driven Recon",
  "💣 Zero-Day Exploit Dev",
  "💉 Prompt Injection",
  "🔓 Credential Harvesting",
  "↔ Lateral Movement"
];

const LAYERS = [
  {
    id: 'perimeter', label: 'PERIMETER & EGRESS CONTROLS', color: C.net, ref: '§3.4 · §4.2.1.2',
    components: [
      { id: 'fw', label: 'Next-Gen\nFirewall', icon: '🛡', desc: 'Block prohib. + high-risk dual-use traffic. Enforce egress allow-lists per AI agent subnet.' },
      { id: 'dlp', label: 'DLP\nInspection', icon: '🔍', desc: 'Inspect outbound HTTPS from agent compute. Block unexpected POSTs with code/data payloads. Alert on public gist/paste creation (§4.1.1).' },
      { id: 'waf', label: 'WAF +\nProbe Classifier', icon: '⚡', desc: 'Three-tier classifier: BLOCK (worms/exfil), ALERT (exploit dev), LOG (vuln scan). Matches Anthropic §3.2 mitigation model.' },
      { id: 'prx', label: 'TLS Inspection\nProxy', icon: '🌐', desc: 'Decrypt + inspect AI agent egress. DNS exfiltration detection. Alert on long-subdomain queries or high-freq DNS to new domains.' }
    ]
  },
  {
    id: 'network', label: 'NETWORK SEGMENTATION', color: C.net, ref: '§3.4 Linked Exploit Chains',
    components: [
      { id: 'dmz', label: 'DMZ', icon: '🔲', desc: 'Public-facing services isolated. No direct route to prod/AI zones.' },
      { id: 'ainet', label: 'AI Compute\nZone', icon: '🤖', desc: 'Isolated VLAN. Explicit egress allow-list only. No /proc access at cgroup/seccomp layer. No shared memory namespace with host.' },
      { id: 'prod', label: 'Production\nZone', icon: '⚙', desc: 'Zero-trust lateral movement: no implicit trust. Agents require human-gated write access.' },
      { id: 'pii', label: 'PII / Data\nZone', icon: '📦', desc: 'Separate VLAN. AI agents have no standing access. JIT access with time-bound tokens only.' },
      { id: 'ot', label: 'OT / ICS\nZone', icon: '🏭', desc: 'Air-gapped or one-way data diode. Note: §3.4 — Mythos Preview failed OT range, but this cannot be assumed as permanent.' }
    ]
  },
  {
    id: 'identity', label: 'IDENTITY, SECRETS & PRIVILEGE', color: C.identity, ref: '§4.5.3.1 Memory Credential Extraction',
    components: [
      { id: 'mfa', label: 'MFA / FIDO2\nEvery Priv. Account', icon: '🔐', desc: 'Mandatory hardware MFA for all privileged accounts, CI/CD consoles, cloud admin. §3.4: reused credentials were a primary attack vector.' },
      { id: 'pam', label: 'PAM\nJIT Access', icon: '⏱', desc: 'No standing admin sessions. Just-in-time elevation with automated expiry. Service accounts: min privilege, auto-rotation.' },
      { id: 'vault', label: 'Secrets Manager\nEphemeral Tokens', icon: '🗄', desc: 'Never embed credentials in AI agent env-vars or files. Hardware-backed injection, scoped per-session. Rotate all credentials post-session (§4.5.3.1).' },
      { id: 'os', label: 'OS Hardening\nptrace_scope=2', icon: '🔒', desc: 'Block ptrace by default. Audit /proc/[pid]/mem access. Transparent memory encryption where available. Prevents gdb+dd credential extraction (§4.5.3.1).' }
    ]
  },
  {
    id: 'aicontrols', label: 'AI AGENT RUNTIME CONTROLS', color: C.ai, ref: '§3.2 · §4.1.1 · §4.2.2 · §8.3',
    components: [
      { id: 'sand', label: 'Hardened\nSandbox', icon: '📦', desc: 'Read-only rootfs, no_new_privs, seccomp blocking ptrace/raw sockets. No shared netns with prod. Immutable runtime — agents cannot modify themselves or inject into other processes.' },
      { id: 'lp', label: 'Least-Privilege\nManifest', icon: '📋', desc: 'Explicit capability manifest per task. Block --dangerously-skip-permissions at infra, not model. Subagents cannot exceed parent\'s permissions. Time-bound tool tokens.' },
      { id: 'hil', label: 'Human-in-the-Loop\nGates', icon: '👤', desc: 'Mandatory confirmation before: rm, force-push, DROP TABLE, prod deploys. Bulk/destructive ops require dry-run reviewed by human. AI agents cannot write prod without manual gate.' },
      { id: 'pi', label: 'Prompt Injection\nDefense', icon: '🛡', desc: 'All external content treated as untrusted. Instruction segmentation: system instructions delimited from external data. ART/SHADE-style red-teaming on all data-processing agents (§8.3.2).' }
    ]
  },
  {
    id: 'detection', label: 'DETECTION, MONITORING & RESPONSE', color: C.detect, ref: '§4.2.1.2 Automated Offline Monitoring',
    components: [
      { id: 'edr', label: 'EDR\nBehavioral', icon: '🔍', desc: 'Behavioral detection on every endpoint. Alert on: /proc access, ptrace calls, encoded commands, unexpected process spawning, git history modification.' },
      { id: 'siem', label: 'SIEM\nCorrelation', icon: '📊', desc: 'Full tool-call logging for AI agents. Automated anomaly detection: looping retries >50, credential scan patterns, network reach-back from isolated containers.' },
      { id: 'nta', label: 'NTA East-West\nTraffic', icon: '🌐', desc: 'Full east-west traffic analysis. Critical: flat-network lateral movement was the primary attack path in §3.4 ranges.' },
      { id: 'ir', label: 'AI Incident\nPlaybooks', icon: '📟', desc: 'AI-specific IR categories: agent escape, credential extraction, unauthorized publication, reckless bulk action. Kill-switch: terminate all agent sessions within 5 min. Full transcript forensics post-incident.' }
    ]
  },
  {
    id: 'chain', label: 'SUPPLY CHAIN & CONFIGURATION', color: C.chain, ref: '§3.4 Config Errors · §4.1.4 Pre-Deploy Testing',
    components: [
      { id: 'iac', label: 'IaC Security\nLinting', icon: '✅', desc: 'Checkov/tfsec in all CI pipelines. Config drift detection: alert when running config diverges from IaC baseline. Disable default credentials on all new deployments.' },
      { id: 'cspm', label: 'CSPM\nReal-time', icon: '☁', desc: 'Cloud security posture management with real-time misconfiguration alerting. §3.4: config errors were the #2 explicit attack surface.' },
      { id: 'patch', label: 'Patch SLA\nCrit: 72hr', icon: '🔧', desc: 'Critical/High CVEs patched within 72 hours. Continuous asset inventory. Prioritize software exposed to AI agents. Note: §3.1 — Mythos Preview has training-data parity with public CVE databases.' },
      { id: 'gate', label: '24hr Pre-Deploy\nAlignment Gate', icon: '🚦', desc: 'Mirror Anthropic §4.1.4: new model versions held back from agentic traffic, restricted to test group, parallel assessment tracks before release. Treat model updates as code deployments.' }
    ]
  }
];

// --- UTILS ---
function getRelatedThreats(id) {
  const map = {
    fw:    ["AI-Driven Recon", "Zero-Day Exploit Dev"],
    dlp:   ["Covert Data Exfiltration (§4.1.1)", "Unauthorized Publication"],
    waf:   ["Prompt Injection", "Exploit Dev (Dual-use)"],
    prx:   ["DNS Exfiltration", "Covert Egress"],
    dmz:   ["Lateral Movement", "Initial Access"],
    ainet: ["Sandbox Escape (§3.4)", "Container Breakout"],
    prod:  ["Reckless Bulk Actions (§4.1.1)", "Unauthorized Writes"],
    pii:   ["Credential Harvesting", "PII Exfiltration"],
    ot:    ["OT/ICS Disruption (§3.4 partial)"],
    mfa:   ["Credential Harvesting", "Reused Credentials (§3.4)"],
    pam:   ["Privilege Escalation (§4.5.3.1)", "Standing Admin Abuse"],
    vault: ["Memory Credential Extraction (§4.5.3.1)", "Env-var Harvesting"],
    os:    ["gdb+dd Process Memory Scan (§4.5.3.1)", "/proc Exploitation"],
    sand:  ["Sandbox Escape (§3.4)", "Container Escape", "Host Breakout"],
    lp:    ["Permission Escalation (§4.2.1.2)", "Subagent Privilege Expansion"],
    hil:   ["Reckless Bulk Destruction (§4.1.1)", "Unauthorized Prod Writes"],
    pi:    ["Prompt Injection (§8.3.2)", "LLM Judge Manipulation"],
    edr:   ["Credential Scan", "/proc Access", "Encoded Commands"],
    siem:  ["Cover-track Behavior (§4.5.4)", "Unauthorized Data Transfer"],
    nta:   ["Lateral Movement (§3.4)", "East-West Exploit Chains"],
    ir:    ["All AI-Originated Incidents", "Agent Escape Events"],
    iac:   ["Configuration Errors (§3.4)", "Misconfiguration Exploitation"],
    cspm:  ["Cloud Misconfiguration", "Exposed Services"],
    patch: ["Known CVE Exploitation (§3.1)", "Outdated Software (§3.4)"],
    gate:  ["Untested Model Capabilities (§4.1.4)", "Pre-Deploy Alignment Gaps"]
  };
  return map[id] || ["General threat surface reduction"];
}

// --- SUB-COMPONENTS ---
const NodeCard = ({ node, color, onClick, active }) => {
  return (
    <div
      onClick={() => onClick(node)}
      style={{
        cursor: 'pointer',
        background: active ? color + "18" : C.bgCard,
        border: `1px solid ${active ? color + "70" : C.border}`,
        borderRadius: 6,
        padding: "9px 11px",
        minWidth: 110,
        flex: "1 1 110px",
        transition: "all 0.18s",
        boxShadow: active ? `0 0 14px ${color}28` : 'none',
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 5 }}>{node.icon}</div>
      <div style={{ 
        fontSize: 10, 
        color: active ? color : C.text, 
        fontFamily: "'JetBrains Mono', monospace", 
        lineHeight: 1.45, 
        fontWeight: 600,
        whiteSpace: 'pre-wrap'
      }}>
        {node.label}
      </div>
    </div>
  );
};

const LayerSection = ({ layer, activeNode, onNode }) => {
  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${layer.color}`,
      borderRadius: 6,
      marginBottom: 10,
    }}>
      <div style={{
        background: `linear-gradient(90deg, ${layer.color}14 0%, ${C.bgPanel} 60%)`,
        padding: "8px 14px",
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: 10, color: layer.color, fontWeight: 'bold', letterSpacing: "0.12em" }}>{layer.label}</div>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>{layer.ref}</div>
      </div>
      <div style={{ padding: "10px 12px", display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {layer.components.map(comp => (
          <NodeCard 
            key={comp.id} 
            node={comp} 
            color={layer.color} 
            active={activeNode?.id === comp.id}
            onClick={onNode}
          />
        ))}
      </div>
    </div>
  );
};

// --- MAIN ARCHITECTURE COMPONENT ---
export default function SecurityArchitectureDiagram() {
  const [activeNode, setActiveNode] = useState(null);
  const [showFlows, setShowFlows] = useState(true);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 5);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const handleNode = (node) => {
    if (activeNode?.id === node.id) setActiveNode(null);
    else setActiveNode(node);
  };

  const activeLayer = LAYERS.find(l => l.components.some(c => c.id === activeNode?.id));

  const sidebarFindings = [
    { ref: "§3.1", text: "100% CTF saturation", color: C.threat },
    { ref: "§3.4", text: "10-hr network sim solved autonomously", color: C.threat },
    { ref: "§4.5.3.1", text: "gdb+dd credential extraction from live memory", color: C.threat },
    { ref: "§4.1.1", text: "Exploit self-deletion to evade detection", color: C.threat },
    { ref: "§3.2", text: "Probe classifier mitigation architecture", color: C.detect },
    { ref: "§4.1.4", text: "24hr pre-deploy alignment gate", color: C.chain },
  ];

  const globalStyle = {
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={globalStyle}>
      {/* HEADER */}
      <header style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.2em", marginBottom: 4 }}>CLAUDE MYTHOS PREVIEW · §3 CYBER · §4 ALIGNMENT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e8eaff", letterSpacing: "-0.02em" }}>AI-Native Security Architecture</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button 
            onClick={() => setShowFlows(!showFlows)}
            style={{ 
              background: 'transparent', 
              border: `1px solid ${C.border}`, 
              color: showFlows ? C.detect : C.muted, 
              fontSize: 10, 
              padding: '6px 12px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {showFlows ? '● FLOWS ON' : '○ FLOWS OFF'}
          </button>
          <div style={{ display: 'flex', gap: 15 }}>
            {[
              {l: 'THREAT', c: C.threat}, {l: 'NETWORK', c: C.net}, {l: 'IDENTITY', c: C.identity},
              {l: 'AI CTRL', c: C.ai}, {l: 'DETECT', c: C.detect}, {l: 'SUPPLY', c: C.chain}
            ].map(l => (
              <div key={l.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, background: l.c, borderRadius: '50%' }} />
                <span style={{ fontSize: 9, fontWeight: 'bold' }}>{l.l}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* MAIN COLUMN */}
        <main style={{ flex: 1, padding: "20px 20px 20px 24px", overflowY: 'auto', position: 'relative' }}>
          
          {/* THREAT BANNER */}
          <div style={{ 
            background: `linear-gradient(90deg, ${C.threat}18 0%, ${C.bgPanel} 80%)`,
            border: `1px solid ${C.threat}50`,
            borderRadius: 6, marginBottom: 10, padding: "10px 14px",
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: 10, color: C.threat, fontWeight: 'bold', letterSpacing: "0.15em" }}>▲ THREAT ACTORS</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {THREAT_PILLS.map((pill, i) => (
                <div key={pill} style={{
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 4,
                  transition: "all 0.4s",
                  background: pulse === i ? C.threat + "18" : 'transparent',
                  border: `1px solid ${pulse === i ? C.threat + "50" : 'transparent'}`,
                  color: pulse === i ? C.threat : C.muted
                }}>
                  {pill}
                </div>
              ))}
            </div>
          </div>

          {/* FLOW LINES */}
          {showFlows && (
            <div style={{ position: 'relative', height: 0, overflow: 'visible', zIndex: 10 }}>
              <svg style={{ position: 'absolute', width: '100%', height: 800, pointerEvents: 'none' }}>
                {[15, 35, 55, 75].map((x, i) => (
                  <line 
                    key={x} 
                    x1={`${x}%`} y1="8" x2={`${x}%`} y2="780" 
                    stroke={[C.net, C.ai, C.detect, C.identity][i]} 
                    strokeWidth="1" strokeDasharray="4,8" opacity="0.18" 
                  />
                ))}
              </svg>
            </div>
          )}

          {/* LAYERS */}
          {LAYERS.map(layer => (
            <LayerSection 
              key={layer.id} 
              layer={layer} 
              activeNode={activeNode} 
              onNode={handleNode} 
            />
          ))}

          {/* CORE ASSETS */}
          <div style={{ border: `1px solid ${C.core}50`, borderLeft: `3px solid ${C.core}`, borderRadius: 6, marginBottom: 10 }}>
            <div style={{ background: `linear-gradient(90deg, ${C.core}18 0%, ${C.bgPanel} 60%)`, padding: "8px 14px", display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 10, color: C.core, fontWeight: 'bold', letterSpacing: "0.12em" }}>CORE PROTECTED ASSETS</div>
              <div style={{ fontSize: 9, color: C.muted }}>All zones above exist to protect these</div>
            </div>
            <div style={{ padding: "10px 12px", display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { i: '💎', l: 'Crown Jewels\n(PII · IP · Keys)', c: C.core },
                { i: '⚙', l: 'Production\nSystems', c: C.core },
                { i: '🧠', l: 'AI Model\nWeights', c: C.ai },
                { i: '📁', l: 'Source\nControl', c: C.core }
              ].map(asset => (
                <div key={asset.l} style={{ flex: "1 1 140px", background: asset.c + "10", border: `1px solid ${asset.c}40`, borderRadius: 6, padding: "9px 14px", display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20 }}>{asset.i}</div>
                  <div style={{ fontSize: 10, fontWeight: 'bold', color: asset.c, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{asset.l}</div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* SIDEBAR */}
        <aside style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${C.border}`, sticky: 'top', padding: "20px 16px", overflowY: 'auto', maxHeight: '100vh', background: C.bgPanel }}>
          {!activeNode ? (
            <>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.15em", marginBottom: 16 }}>ARCHITECTURE OVERVIEW</div>
              {LAYERS.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 32, background: l.color }} />
                  <div>
                    <div style={{ fontSize: 9, color: l.color, letterSpacing: "0.08em", fontWeight: 'bold' }}>{l.label}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>{l.components.length} controls</div>
                  </div>
                </div>
              ))}
              <div style={{ height: 1, background: C.border, marginTop: 20 }} />
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.7, marginTop: 16 }}>
                Click any component to see its security rationale, System Card evidence, and threat mitigations.
              </div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.12em", marginTop: 20, marginBottom: 10 }}>KEY FINDINGS (SYSTEM CARD)</div>
              {sidebarFindings.map(f => (
                <div key={f.ref} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <div style={{ fontSize: 9, color: C.text, background: f.color + "14", border: `1px solid ${f.color}30`, padding: "2px 5px", borderRadius: 2, whiteSpace: 'nowrap' }}>{f.ref}</div>
                  <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.5 }}>{f.text}</div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{activeNode.icon}</div>
              <div style={{ fontSize: 13, color: activeLayer.color, fontWeight: 'bold', lineHeight: 1.4 }}>{activeNode.label.replace('\n', ' ')}</div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 14 }}>{activeLayer.ref}</div>
              <div style={{ height: 1, background: C.border }} />
              <div style={{ fontSize: 11, color: "#9090b8", lineHeight: 1.75, marginTop: 14 }}>{activeNode.desc}</div>
              
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 5, padding: "10px 12px", marginTop: 20 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>LAYER</div>
                <div style={{ fontSize: 10, color: activeLayer.color, fontWeight: 'bold' }}>{activeLayer.label}</div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 8 }}>MITIGATES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {getRelatedThreats(activeNode.id).map(t => (
                    <div key={t} style={{ fontSize: 10, color: C.threat, background: C.threat + "10", border: `1px solid ${C.threat}30`, borderRadius: 3, padding: "4px 8px" }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setActiveNode(null)}
                style={{ width: '100%', marginTop: 20, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: 8, borderRadius: 4, fontSize: 10, letterSpacing: "0.1em", cursor: 'pointer' }}
              >
                ← DESELECT
              </button>
            </>
          )}
        </aside>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bgPanel, padding: "10px 24px", display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: C.muted }}>DATA FLOWS:</div>
        {[
          { l: 'Filtered agent egress', c: C.net },
          { l: 'Exfil alerts → SIEM', c: C.detect },
          { l: 'Ephemeral token injection', c: C.identity },
          { l: 'SIEM correlation → IR', c: C.detect },
          { l: 'Human-gated prod writes', c: C.ai },
          { l: 'Deploy gate → AI runtime', c: C.chain }
        ].map(f => (
          <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: f.c, opacity: 0.8 }}>
            <div style={{ width: 18, height: 1, background: f.c, opacity: 0.7 }} />
            <span>{f.l}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}