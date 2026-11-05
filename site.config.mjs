// Edit this file to update the homepage. GitHub Actions rebuilds it on every push.
export default {
  name: 'Youlong Chen',
  initials: 'YC',
  role: 'Ph.D. Student',
  affiliation: 'Institute of Computing Technology, Chinese Academy of Sciences',
  affiliationUrl: 'https://english.ict.cas.cn/',
  location: 'Beijing, China',
  email: 'chenyoulong2017@gmail.com',
  github: 'https://github.com/YLChen-007',
  url: 'https://ylchen-007.github.io/',
  description: 'Youlong Chen is a Ph.D. student at the Institute of Computing Technology, Chinese Academy of Sciences, researching program analysis, software security, and AI agent security.',
  headline: ['Program analysis for', 'more secure systems.'],
  introduction: 'I am a Ph.D. student at the Institute of Computing Technology, Chinese Academy of Sciences. My research focuses on understanding how complex software behaves and using that understanding to discover security vulnerabilities.',
  researchStatement: 'I work at the intersection of program analysis and software security, with a particular interest in distributed systems and AI agents.',
  interests: [
    { title: 'Program analysis', description: 'Recovering data flows and program semantics to make security analysis more precise and useful.' },
    { title: 'Distributed system security', description: 'Understanding cross-component interactions, authorization checks, and vulnerabilities in cloud systems.' },
    { title: 'AI & agent security', description: 'Studying security boundaries in LLM-powered applications and agents that interact with tools and external systems.' }
  ],
  publications: [
    {
      title: 'Tracing the Invisible: Semantic Message Flow Discovery via Data Contracts in Real-World Distributed Systems',
      authors: ['Youlong Chen', 'Jie Lu', 'Mingtao Huang', 'Chenghang Shi', 'Yongheng Huang', 'Haofeng Li', 'Dong Liu', 'Mengna Ma', 'Yong Liu', 'Qinfen Hao', 'Lian Li'],
      venue: 'ASE 2026',
      note: 'HERMES',
      description: 'Recovering semantic message flows across components in real-world distributed systems through data contracts.',
      links: [
        { label: 'Paper', url: 'https://doi.org/10.1145/3832783.3834372' },
        { label: 'Conference', url: 'https://conf.researchr.org/details/ase-2026/ase-2026-research-track/42/Tracing-the-Invisible-Semantic-Message-Flow-Discovery-via-Data-Contracts-in-Real-Wor' }
      ]
    },
    {
      title: 'THESEUS: Smart Web Crawling via Resource-Guided Semantic Modeling',
      authors: ['Yongheng Huang', 'Chenghang Shi', 'Wenxiao Yao', 'Jie Lu', 'Haofeng Li', 'Youlong Chen', 'Dong Liu', 'Mengna Ma', 'Yong Liu', 'Qinfen Hao', 'Lian Li'],
      venue: 'CCS 2026',
      note: 'Accepted',
      description: 'Resource-guided semantic modeling for exploring complex web applications.',
      links: [{ label: 'Conference program', url: 'https://www.sigsac.org/ccs/CCS2026/program/schedule.html' }]
    }
  ],
  disclosures: [
    {
      project: 'OpenClaw',
      title: 'Execution approval bypass via config.patch',
      description: 'Reported a cross-tool authorization gap affecting execution approvals. The vendor credited the report and released a fix.',
      label: 'GHSA-v3qc-wrwx-j3pw',
      url: 'https://github.com/openclaw/openclaw/security/advisories/GHSA-v3qc-wrwx-j3pw'
    }
  ]
};
