export const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'About',      href: '/about' },
  { label: 'Protocol',   href: '/protocol' },
  { label: 'Technology', href: '/technology' },
  { label: 'Litepaper',  href: '/litepaper' },
  { label: 'Build',      href: '/build' },
  { label: 'Brand',      href: '/brand' },
]

export const PRIMITIVES = [
  {
    number: '01',
    name: 'Identity',
    namespace: 'ZVN.Identity',
    description:
      'DID-anchored credentials with jurisdiction tags and KYC status, anchored on Cardano through Hyperledger Identus. Works without a bank account or smartphone.',
    color: '#A78BFA',
  },
  {
    number: '02',
    name: 'Trust Score',
    namespace: 'ZVN.Trust',
    description:
      'Composable on-chain trust graph owned by the holder. Attestation events accumulate across every application on the protocol and travel with the participant.',
    color: '#8B5CF6',
  },
  {
    number: '03',
    name: 'Covenant',
    namespace: 'ZVN.Covenant',
    description:
      'Shielded, self-enforcing economic agreements on Midnight. Terms stay private. Execution is verifiable. No intermediary required at any step.',
    color: '#7C3AED',
  },
  {
    number: '04',
    name: 'Distribution',
    namespace: 'ZVN.Distribution',
    description:
      'Atomic proportional value distribution on Cardano, triggered by oracle-attested events. Four outputs. One Aiken validator. No gaps and no human intervention.',
    color: '#6D28D9',
  },
  {
    number: '05',
    name: 'Intelligence',
    namespace: 'ZVN.Intelligence',
    description:
      'AI market benchmarking, covenant viability scoring, anomaly detection, and multilingual interfaces in Yoruba, Igbo, Hausa, and Pidgin. Built on ASI Cloud and Fetch.ai.',
    color: '#5B21B6',
  },
]

export const STACK = [
  {
    layer: 'Settlement',
    tech: 'Cardano + Aiken',
    description:
      'eUTxO-based distribution validators, $ZVN native asset, governance contracts. Production mainnet with 6M+ blocks and zero outages.',
    color: '#1C5F8A',
    labelColor: '#7DD3FC',
  },
  {
    layer: 'Privacy',
    tech: 'Midnight Network + Compact',
    description:
      'Shielded covenant state, ZK proofs for distribution correctness, selective disclosure. Mainnet live March 2026. Highest-capability privacy layer on Cardano.',
    color: '#4C1D95',
    labelColor: '#A78BFA',
  },
  {
    layer: 'Identity',
    tech: 'Hyperledger Identus',
    description:
      'W3C-compliant DID credentials anchored on Cardano. Apache 2.0 open source under Linux Foundation. TypeScript, Swift, and Kotlin SDKs available.',
    color: '#0F766E',
    labelColor: '#5EEAD4',
  },
  {
    layer: 'Oracle',
    tech: 'Orcfax COOP + Charli3',
    description:
      'Revenue attestation via Cardano Open Oracle Protocol. Price feeds for ADA/NGN and multi-currency conversion. Full on-chain audit trail with open Explorer.',
    color: '#92400E',
    labelColor: '#FCD34D',
  },
  {
    layer: 'Intelligence',
    tech: 'ASI Cloud + Fetch.ai Agentverse',
    description:
      'Self-hosted open-source models on permissionless GPU compute. Autonomous market intelligence agents deployed on Agentverse. Sensitive data never reaches third-party providers.',
    color: '#065F46',
    labelColor: '#6EE7B7',
  },
]

export const ZVN_UTILITIES = [
  {
    name: 'Fee payment',
    description:
      'All protocol transactions require $ZVN. Fees accumulate in the Protocol Treasury governed by stakers.',
  },
  {
    name: 'Governance',
    description:
      'Stakers vote on fee schedules, schema approvals, oracle providers, and treasury allocations.',
  },
  {
    name: 'Node staking',
    description:
      'Sequencer and oracle operators stake $ZVN. Honest operation earns fee revenue. Negligence triggers automated slashing.',
  },
  {
    name: 'Access Fund',
    description:
      'Community Access Fund subsidises protocol fees for the smallest-scale participants from day one.',
  },
]

export const COLOURS = [
  { hex: '#0D0B14', name: 'Void',        usage: 'Primary background',  rgb: '13, 11, 20' },
  { hex: '#13101E', name: 'Depth',       usage: 'Cards and panels',    rgb: '19, 16, 30' },
  { hex: '#1E1640', name: 'Shadow',      usage: 'Borders and dividers',rgb: '30, 22, 64' },
  { hex: '#4C1D95', name: 'Deep Purple', usage: 'Strong accents',      rgb: '76, 29, 149' },
  { hex: '#6D28D9', name: 'Core Purple', usage: 'Primary interactive', rgb: '109, 40, 217' },
  { hex: '#8B5CF6', name: 'Violet',      usage: 'Hover states, links', rgb: '139, 92, 246' },
  { hex: '#A78BFA', name: 'Lavender',    usage: 'Section headings',    rgb: '167, 139, 250' },
  { hex: '#C4B5FD', name: 'Mist',        usage: 'Body emphasis',       rgb: '196, 181, 253' },
  { hex: '#E8E6F0', name: 'Light',       usage: 'Primary headings',    rgb: '232, 230, 240' },
]

export const REPOS = [
  { name: 'zivana-core',        desc: 'Aiken smart contracts — distribution, treasury, staking, $ZVN minting policy',    phase: 'Phase 0' },
  { name: 'zivana-midnight',    desc: 'Compact contracts — covenant state machine, ZK proofs, selective disclosure',      phase: 'Phase 0' },
  { name: 'zivana-identity',    desc: 'Hyperledger Identus integration — DID schemas, credential templates, KYC flows',   phase: 'Phase 0' },
  { name: 'zivana-oracle',      desc: 'Revenue attestation oracle — COOP implementation, marketplace API connectors',     phase: 'Phase 1' },
  { name: 'zivana-sdk',         desc: 'TypeScript, JavaScript, and Python SDK — five ZVN namespaces for builders',        phase: 'Phase 2' },
  { name: 'zivana-intelligence','desc': 'Market Intelligence Primitive — AI benchmarking, anomaly detection, multilingual', phase: 'Phase 1' },
  { name: 'zivana-governance',  desc: 'On-chain governance contracts and Schema Registry',                                phase: 'Phase 2' },
  { name: 'zivana-token',       desc: '$ZVN minting policy, vesting contract, Community Access Fund',                     phase: 'Phase 1' },
  { name: 'zivana-docs',        desc: 'Full protocol documentation — architecture reference, SDK guides, tutorials',      phase: 'Phase 2' },
]