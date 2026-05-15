(function () {
    const STORAGE_KEY = 'bevapExecutionFlowData';
    const STAGE_META = {
        pending: {
            key: 'pending',
            label: 'Aguardando Execução',
            title: 'Aguardando Execução da Atividade',
            shortLabel: 'Aguardando',
            file: 'ux-marco-aguardando-execucao.html',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
            icon: 'fa-regular fa-clock'
        },
        execution: {
            key: 'execution',
            label: 'Execução da Atividade',
            title: 'Tela de Execução da Atividade',
            shortLabel: 'Execução',
            file: 'ux-marco-execucao-atividade.html',
            badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: 'fa-solid fa-play'
        },
        requester: {
            key: 'requester',
            label: 'Solicitante - Validação',
            title: 'Tela do Solicitante - Validação da Atividade',
            shortLabel: 'Solicitante',
            file: 'ux-marco-validacao-solicitante.html',
            badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            icon: 'fa-solid fa-user-check'
        },
        ti: {
            key: 'ti',
            label: 'TI - Validação',
            title: 'Tela de TI - Validação da Atividade',
            shortLabel: 'TI',
            file: 'ux-marco-validacao-ti.html',
            badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
            icon: 'fa-solid fa-shield-halved'
        },
        docs: {
            key: 'docs',
            label: 'Documentação',
            title: 'Documentação do Fluxo',
            shortLabel: 'Docs',
            file: 'ux-marcos-documentacao.html',
            badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            icon: 'fa-solid fa-book-open'
        }
    };
    const STAGE_ORDER = ['pending', 'execution', 'requester', 'ti'];

    const defaultFlowData = {
        project: {
            code: 'PRJ-2026-033',
            title: 'Implantar SSO corporativo',
            area: 'Tecnologia da Informacao',
            sponsor: 'Diretoria TI',
            priority: 'Critico',
            requester: 'Joao Vieira',
            projectManager: 'Ana Costa',
            techLead: 'Seguranca da Informacao',
            planningSource: 'ux-planejamento.html',
            executionSource: 'ux-execucao-projeto.html',
            objective: 'Centralizar a autenticacao em um unico provedor para reduzir chamados, reforcar politicas de seguranca e simplificar o acesso as aplicacoes corporativas.',
            summary: 'Fluxo prototipado para a execucao das tarefas de marco com transicao entre pendencia, execucao, validacao do solicitante e validacao tecnica.',
            baselinePeriod: '05/02/2026 ate 20/03/2026',
            generatedAt: '11/05/2026 09:30'
        },
        milestones: [
            {
                code: 'MK-01',
                name: 'Concluir descoberta e baseline tecnico',
                period: '05/02/2026 ate 10/02/2026',
                plannedStart: '2026-02-05',
                plannedEnd: '2026-02-10',
                owner: 'Ana Costa',
                phaseName: 'Descoberta e Analise',
                description: 'Consolida o baseline tecnico e o alinhamento inicial do projeto com negocio, arquitetura e infraestrutura.',
                acceptanceCriteria: [
                    'Escopo funcional validado com negocio e TI.',
                    'Matriz de sistemas impactados aprovada.',
                    'Ambiente de homologacao provisionado para as proximas frentes.'
                ],
                tasks: [
                    {
                        code: 'ATV-001',
                        name: 'Mapear sistemas impactados',
                        phaseName: 'Descoberta e Analise',
                        responsible: 'Carlos Silva',
                        backupResponsible: 'Ana Costa',
                        requester: 'Joao Vieira',
                        techApprover: 'Seguranca da Informacao',
                        plannedStart: '2026-02-05',
                        plannedEnd: '2026-02-07',
                        plannedHours: 24,
                        actualHours: 6,
                        progress: 25,
                        statusLabel: 'Pendente para inicio',
                        priority: 'Alta',
                        description: 'Levantar as aplicacoes, dependencias e impactos operacionais que serao afetados pela federacao SSO.',
                        preparationNotes: 'Confirmar a lista de sistemas prioritarios, evidencias de seguranca e disponibilidade dos donos das aplicacoes.',
                        dependencies: ['Kickoff inicial validado com todas as areas', 'Aprovacao formal do escopo funcional inicial'],
                        importedPlanning: [
                            'Dependencia: aprovacao da arquitetura de autenticacao.',
                            'Observacao: alinhar integracoes prioritarias com ERP e portal do colaborador.',
                            'Esforco planejado: 24 horas / 3 dias uteis.'
                        ],
                        blockers: ['Aguardando validacao final da lista de sistemas pela area de negocio.'],
                        attachments: [
                            { name: 'inventario-sistemas.xlsx', type: 'XLSX', size: '480 KB', status: 'Disponivel' },
                            { name: 'baseline-arquitetura.pdf', type: 'PDF', size: '1.2 MB', status: 'Disponivel' }
                        ],
                        deliverables: [
                            { name: 'Inventario de sistemas impactados', owner: 'Carlos Silva', status: 'Em elaboracao' },
                            { name: 'Mapa de integracoes prioritarias', owner: 'Ana Costa', status: 'Planejado' }
                        ],
                        comments: [
                            { actor: 'Carlos Silva', when: '11/05/2026 08:15', note: 'Lista inicial dos sistemas concluida; aguardando confirmacao das areas.' },
                            { actor: 'Ana Costa', when: '10/05/2026 17:40', note: 'Solicitante reforcou prioridade para ERP e portal do colaborador.' }
                        ],
                        history: [
                            { title: 'Tarefa criada no planejamento', actor: 'Ana Costa', when: '09/05/2026 15:20', detail: 'Vinculada ao marco de baseline tecnico.' },
                            { title: 'Prazo confirmado', actor: 'PMO Corporativo', when: '10/05/2026 09:05', detail: 'Janela de execucao mantida conforme cronograma.' }
                        ],
                        requesterChecklist: [
                            'Entregavel atende os sistemas priorizados pelo solicitante.',
                            'Escopo do levantamento corresponde ao combinado no planejamento.',
                            'Feedback de negocio registrado para proximas ondas.'
                        ],
                        technicalChecklist: [
                            'Inventario versionado em repositorio oficial.',
                            'Dependencias tecnicas classificadas por criticidade.',
                            'Integracoes com risco alto destacadas para seguranca.'
                        ],
                        technicalTests: [
                            { name: 'Revisao de aderencia ao baseline', result: 'Pendente', note: 'Sera executada apos consolidacao do inventario.' },
                            { name: 'Validacao de integracoes criticas', result: 'Nao iniciado', note: 'Depende da aprovacao do solicitante.' }
                        ],
                        currentStage: 'pending'
                    },
                    {
                        code: 'ATV-002',
                        name: 'Provisionar ambiente de homologacao',
                        phaseName: 'Implementacao SSO',
                        responsible: 'Equipe Infraestrutura',
                        backupResponsible: 'Rafael Souza',
                        requester: 'Joao Vieira',
                        techApprover: 'Seguranca da Informacao',
                        plannedStart: '2026-02-06',
                        plannedEnd: '2026-02-10',
                        plannedHours: 32,
                        actualHours: 12,
                        progress: 35,
                        statusLabel: 'Pendente para inicio',
                        priority: 'Critica',
                        description: 'Preparar o ambiente de homologacao com conectividade, certificados e acessos necessarios para os testes de federacao.',
                        preparationNotes: 'Validar janelas de firewall, requisicoes de acesso ao AD e versoes dos certificados.',
                        dependencies: ['Acesso cloud liberado para ambiente de homologacao', 'Descoberta tecnica concluida e validada pela equipe'],
                        importedPlanning: [
                            'Dependencia: liberacao do time de infraestrutura.',
                            'Observacao: ambiente deve replicar politicas de seguranca da producao.',
                            'Esforco planejado: 32 horas / 4 dias uteis.'
                        ],
                        blockers: ['Liberacao do firewall externo pendente.'],
                        attachments: [
                            { name: 'checklist-infra.docx', type: 'DOCX', size: '220 KB', status: 'Disponivel' }
                        ],
                        deliverables: [
                            { name: 'Ambiente de homologacao provisionado', owner: 'Equipe Infraestrutura', status: 'Em elaboracao' },
                            { name: 'Checklist de acessos e conectividade', owner: 'Rafael Souza', status: 'Planejado' }
                        ],
                        comments: [
                            { actor: 'Equipe Infraestrutura', when: '11/05/2026 08:35', note: 'Servidor criado e aguardando liberacao das regras de rede.' }
                        ],
                        history: [
                            { title: 'Tarefa criada no planejamento', actor: 'Ana Costa', when: '09/05/2026 15:25', detail: 'Atividade associada ao marco inicial.' }
                        ],
                        requesterChecklist: [
                            'Ambiente homolog atende a janela de teste combinada.',
                            'Evidencias de configuracao estao anexadas.',
                            'Dependencias externas foram comunicadas.'
                        ],
                        technicalChecklist: [
                            'Acesso ao AD validado.',
                            'Conectividade entre servicos homologada.',
                            'Certificados e secrets armazenados com seguranca.'
                        ],
                        technicalTests: [
                            { name: 'Teste de conectividade LDAP', result: 'Pendente', note: 'Aguardando liberacao de firewall.' },
                            { name: 'Teste de certificado TLS', result: 'Pendente', note: 'Dependente da emissao final.' }
                        ],
                        currentStage: 'pending'
                    }
                ]
            },
            {
                code: 'MK-02',
                name: 'Entrega da implementacao SSO em homologacao',
                period: '10/03/2026 ate 18/03/2026',
                plannedStart: '2026-03-10',
                plannedEnd: '2026-03-18',
                owner: 'TechPartners',
                phaseName: 'Implementacao SSO',
                description: 'Concentra a configuracao final da federacao, aplicacao de politicas e preparacao da homologacao funcional.',
                acceptanceCriteria: [
                    'Federacao com AD funcionando para usuarios piloto.',
                    'Politicas de seguranca aplicadas e auditadas.',
                    'Roteiro de homologacao validado com negocio.'
                ],
                tasks: [
                    {
                        code: 'ATV-003',
                        name: 'Configurar federacao com AD',
                        phaseName: 'Implementacao SSO',
                        responsible: 'TechPartners',
                        backupResponsible: 'Rafael Souza',
                        requester: 'Joao Vieira',
                        techApprover: 'Seguranca da Informacao',
                        plannedStart: '2026-03-10',
                        plannedEnd: '2026-03-12',
                        plannedHours: 48,
                        actualHours: 28,
                        progress: 58,
                        statusLabel: 'Pendente para inicio',
                        priority: 'Critica',
                        description: 'Configurar trust, claims e conectores necessarios para autenticar usuarios piloto via Active Directory.',
                        preparationNotes: 'Conferir atributos obrigatorios, grupos piloto, certificados e endpoints definidos pelo planejamento.',
                        dependencies: ['Credenciais de diretorio liberadas para integracao segura', 'Implementacao SSO preparada para configuracao tecnica inicial'],
                        importedPlanning: [
                            'Dependencia: ambiente de homologacao provisionado.',
                            'Observacao: validar onboarding dos usuarios piloto com suporte de negocio.',
                            'Esforco planejado: 48 horas / 3 dias uteis.'
                        ],
                        blockers: ['Aguardando liberacao do certificado de homologacao final.'],
                        attachments: [
                            { name: 'configuracao-federacao.pdf', type: 'PDF', size: '950 KB', status: 'Disponivel' },
                            { name: 'atributos-claims.xlsx', type: 'XLSX', size: '180 KB', status: 'Disponivel' }
                        ],
                        deliverables: [
                            { name: 'Configuracao da federacao aplicada', owner: 'TechPartners', status: 'Em elaboracao' },
                            { name: 'Matriz de claims e atributos', owner: 'Rafael Souza', status: 'Em revisao' }
                        ],
                        comments: [
                            { actor: 'TechPartners', when: '11/05/2026 09:10', note: 'Claims principais configuradas; pendente importacao do certificado final.' },
                            { actor: 'Rafael Souza', when: '10/05/2026 18:00', note: 'Usuarios piloto confirmados com o solicitante.' }
                        ],
                        history: [
                            { title: 'Planejamento aprovado', actor: 'PMO Corporativo', when: '09/05/2026 16:10', detail: 'Marco liberado para prototipacao de fluxo.' }
                        ],
                        requesterChecklist: [
                            'Usuarios piloto autenticam sem erro.',
                            'Escopo contemplou os sistemas combinados.',
                            'Documentacao de configuracao foi compartilhada.'
                        ],
                        technicalChecklist: [
                            'Trust criado com metadata valida.',
                            'Claims obrigatorias mapeadas.',
                            'Logs de autenticacao sem erros criticos.'
                        ],
                        technicalTests: [
                            { name: 'Teste de login do usuario piloto', result: 'Em andamento', note: '3 de 5 perfis homologados.' },
                            { name: 'Teste de claim de perfil', result: 'Em andamento', note: 'Grupos administrativos ainda pendentes.' }
                        ],
                        currentStage: 'pending'
                    },
                    {
                        code: 'ATV-004',
                        name: 'Aplicar politicas de seguranca',
                        phaseName: 'Implementacao SSO',
                        responsible: 'Seguranca da Informacao',
                        backupResponsible: 'Ana Costa',
                        requester: 'Joao Vieira',
                        techApprover: 'Seguranca da Informacao',
                        plannedStart: '2026-03-12',
                        plannedEnd: '2026-03-15',
                        plannedHours: 28,
                        actualHours: 16,
                        progress: 45,
                        statusLabel: 'Pendente para inicio',
                        priority: 'Alta',
                        description: 'Revisar MFA, politicas de senha, expiracao de sessao e logs de auditoria para os sistemas federados.',
                        preparationNotes: 'Confirmar baseline de seguranca, excecoes aprovadas e risco residual aceito pelo negocio.',
                        dependencies: ['Baseline de seguranca revisada e aprovada pela TI', 'Implementacao SSO configurada para validacao tecnica completa'],
                        importedPlanning: [
                            'Dependencia: claims e grupos da federacao definidos.',
                            'Observacao: evidencias devem compor a validacao tecnica final.',
                            'Esforco planejado: 28 horas / 3 dias uteis.'
                        ],
                        blockers: ['Checklist de auditoria ainda nao aprovado.'],
                        attachments: [
                            { name: 'baseline-seguranca.pdf', type: 'PDF', size: '730 KB', status: 'Disponivel' }
                        ],
                        deliverables: [
                            { name: 'Politicas de seguranca aplicadas', owner: 'Seguranca da Informacao', status: 'Em elaboracao' },
                            { name: 'Relatorio de auditoria inicial', owner: 'Ana Costa', status: 'Planejado' }
                        ],
                        comments: [
                            { actor: 'Seguranca da Informacao', when: '11/05/2026 09:45', note: 'MFA habilitado para perfis administrativos; faltam evidencias de log.' }
                        ],
                        history: [
                            { title: 'Checklist tecnico vinculado', actor: 'Seguranca da Informacao', when: '10/05/2026 11:20', detail: 'Itens criticos definidos para a validacao final.' }
                        ],
                        requesterChecklist: [
                            'Politicas tecnicas nao impactam o uso acordado.',
                            'Risco residual foi comunicado ao solicitante.',
                            'Procedimento de suporte foi informado.'
                        ],
                        technicalChecklist: [
                            'MFA habilitado para grupos criticos.',
                            'Sessao e timeout aderentes a politica corporativa.',
                            'Logs encaminhados para monitoramento central.'
                        ],
                        technicalTests: [
                            { name: 'Teste de MFA', result: 'Aprovado parcialmente', note: 'Perfis administrativos OK; perfis operacionais em ajuste.' },
                            { name: 'Teste de trilha de auditoria', result: 'Pendente', note: 'Aguardando consolidacao de logs.' }
                        ],
                        currentStage: 'pending'
                    }
                ]
            },
            {
                code: 'MK-03',
                name: 'Go-live e estabilizacao inicial',
                period: '14/03/2026 ate 20/03/2026',
                plannedStart: '2026-03-14',
                plannedEnd: '2026-03-20',
                owner: 'PMO Corporativo',
                phaseName: 'Validacao e Go-Live',
                description: 'Organiza a janela de go-live, monitoramento inicial e aprovacao final para encerramento do marco.',
                acceptanceCriteria: [
                    'UAT concluido sem pendencias criticas abertas.',
                    'Checklist de producao aprovado pelas areas responsaveis.',
                    'Monitoramento intensivo definido para a primeira semana.'
                ],
                tasks: [
                    {
                        code: 'ATV-005',
                        name: 'Executar bateria de testes UAT',
                        phaseName: 'Validacao e Go-Live',
                        responsible: 'Carlos Silva',
                        backupResponsible: 'Joao Vieira',
                        requester: 'Joao Vieira',
                        techApprover: 'Seguranca da Informacao',
                        plannedStart: '2026-03-14',
                        plannedEnd: '2026-03-17',
                        plannedHours: 32,
                        actualHours: 20,
                        progress: 62,
                        statusLabel: 'Pendente para inicio',
                        priority: 'Alta',
                        description: 'Executar o roteiro de homologacao funcional com usuarios chave e registrar evidencias para aprovacao.',
                        preparationNotes: 'Garantir roteiro aprovado, massa de testes e agenda com usuarios chave.',
                        dependencies: ['Roteiro aprovado para homologacao funcional com usuarios', 'Implementacao SSO pronta para testes integrados finais'],
                        importedPlanning: [
                            'Dependencia: federacao e politicas aplicadas.',
                            'Observacao: registrar feedback por jornada de usuario.',
                            'Esforco planejado: 32 horas / 4 dias uteis.'
                        ],
                        blockers: ['Agenda final do solicitante em confirmacao.'],
                        attachments: [
                            { name: 'roteiro-uat.pdf', type: 'PDF', size: '640 KB', status: 'Disponivel' }
                        ],
                        deliverables: [
                            { name: 'Roteiro UAT executado', owner: 'Carlos Silva', status: 'Em elaboracao' },
                            { name: 'Registro de evidencias UAT', owner: 'Joao Vieira', status: 'Planejado' }
                        ],
                        comments: [
                            { actor: 'Carlos Silva', when: '11/05/2026 10:10', note: 'Casos de uso priorizados definidos; pendente agenda com usuarios chave.' }
                        ],
                        history: [
                            { title: 'Tarefa preparada para UAT', actor: 'Ana Costa', when: '10/05/2026 13:55', detail: 'Solicitante confirmou a lista de participantes.' }
                        ],
                        requesterChecklist: [
                            'Casos criticos foram executados com sucesso.',
                            'Pendencias e feedbacks ficaram registrados.',
                            'Entregaveis anexados para aprovacao final.'
                        ],
                        technicalChecklist: [
                            'Logs de autenticacao coletados durante UAT.',
                            'Falhas tecnicas classificadas por severidade.',
                            'Ajustes com impacto em producao revisados.'
                        ],
                        technicalTests: [
                            { name: 'Teste de jornada completa', result: 'Em andamento', note: '2 de 4 jornadas aprovadas.' },
                            { name: 'Teste de fallback', result: 'Pendente', note: 'Sera executado na janela de contingencia.' }
                        ],
                        currentStage: 'pending'
                    },
                    {
                        code: 'ATV-006',
                        name: 'Aprovar checklist de producao',
                        phaseName: 'Validacao e Go-Live',
                        responsible: 'Seguranca da Informacao',
                        backupResponsible: 'PMO Corporativo',
                        requester: 'Joao Vieira',
                        techApprover: 'Seguranca da Informacao',
                        plannedStart: '2026-03-17',
                        plannedEnd: '2026-03-20',
                        plannedHours: 16,
                        actualHours: 8,
                        progress: 40,
                        statusLabel: 'Pendente para inicio',
                        priority: 'Critica',
                        description: 'Consolidar checklist de producao com requisitos tecnicos, operacionais e de suporte para liberar o go-live.',
                        preparationNotes: 'Revisar plano de rollback, contingencia e monitoramento do primeiro dia.',
                        dependencies: ['Evidencias completas anexadas para aprovacao de go-live', 'Implementacao SSO estabilizada em ambiente de homologacao'],
                        importedPlanning: [
                            'Dependencia: UAT concluido e riscos controlados.',
                            'Observacao: aprovacao tecnica final depende do checklist completo.',
                            'Esforco planejado: 16 horas / 2 dias uteis.'
                        ],
                        blockers: ['Plano de rollback aguardando ajuste do fornecedor.'],
                        attachments: [
                            { name: 'checklist-producao.xlsx', type: 'XLSX', size: '150 KB', status: 'Disponivel' }
                        ],
                        deliverables: [
                            { name: 'Checklist de producao assinado', owner: 'Seguranca da Informacao', status: 'Em elaboracao' },
                            { name: 'Plano de monitoramento D+7', owner: 'PMO Corporativo', status: 'Planejado' }
                        ],
                        comments: [
                            { actor: 'PMO Corporativo', when: '11/05/2026 10:45', note: 'Checklist consolidado em 70%; pendente anexo do rollback.' }
                        ],
                        history: [
                            { title: 'Checklist estruturado', actor: 'Seguranca da Informacao', when: '10/05/2026 14:35', detail: 'Itens obrigatorios mapeados para o go-live.' }
                        ],
                        requesterChecklist: [
                            'Plano de suporte do go-live foi apresentado.',
                            'Areas impactadas concordaram com a janela.',
                            'Entregaveis finais anexados ao processo.'
                        ],
                        technicalChecklist: [
                            'Plano de rollback validado.',
                            'Monitoramento e alertas habilitados.',
                            'Perfis e acessos auditados antes da liberacao.'
                        ],
                        technicalTests: [
                            { name: 'Simulacao de rollback', result: 'Pendente', note: 'Aguardando pacote final do fornecedor.' },
                            { name: 'Teste de monitoramento', result: 'Em andamento', note: 'Alertas principais validados.' }
                        ],
                        currentStage: 'pending'
                    }
                ]
            }
        ]
    };

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getBodyStage() {
        return document.body.dataset.stage || 'pending';
    }

    function getStageMeta(stage) {
        return STAGE_META[stage] || STAGE_META.pending;
    }

    function clampIndex(value, max) {
        const parsed = Number.parseInt(String(value), 10);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        if (parsed > max) return max;
        return parsed;
    }

    function normalizeArray(value, fallback) {
        return Array.isArray(value) && value.length ? value : fallback;
    }

    function expandDependencyLabel(value) {
        const label = String(value || '').trim();
        if (!label) return '';

        const legacyMap = {
            'Kickoff': 'Kickoff inicial validado com todas as areas',
            'Aprovacao': 'Aprovacao formal do escopo funcional inicial',
            'Aprovação': 'Aprovacao formal do escopo funcional inicial',
            'Acesso cloud': 'Acesso cloud liberado para ambiente de homologacao',
            'Descoberta': 'Descoberta tecnica concluida e validada pela equipe',
            'Credenciais de diretorio': 'Credenciais de diretorio liberadas para integracao segura',
            'Implementacao SSO': 'Implementacao SSO preparada para configuracao tecnica inicial',
            'Baseline de seguranca': 'Baseline de seguranca revisada e aprovada pela TI',
            'Roteiro aprovado': 'Roteiro aprovado para homologacao funcional com usuarios',
            'Evidencias completas': 'Evidencias completas anexadas para aprovacao de go-live'
        };

        return legacyMap[label] || label;
    }

    function readStoredFlowData() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function normalizeFlowData(data) {
        const cloned = data ? deepClone(data) : deepClone(defaultFlowData);
        cloned.project = Object.assign({}, defaultFlowData.project, cloned.project || {});
        cloned.milestones = normalizeArray(cloned.milestones, defaultFlowData.milestones).map(function (milestone, milestoneIndex) {
            const baseMilestone = defaultFlowData.milestones[milestoneIndex] || defaultFlowData.milestones[0];
            const normalizedMilestone = Object.assign({}, baseMilestone, milestone || {});
            normalizedMilestone.acceptanceCriteria = normalizeArray(normalizedMilestone.acceptanceCriteria, baseMilestone.acceptanceCriteria || []);
            normalizedMilestone.tasks = normalizeArray(normalizedMilestone.tasks, baseMilestone.tasks || []).map(function (task, taskIndex) {
                const baseTask = (baseMilestone.tasks || [])[taskIndex] || (baseMilestone.tasks || [])[0] || {};
                const normalizedTask = Object.assign({}, baseTask, task || {});
                normalizedTask.attachments = normalizeArray(normalizedTask.attachments, baseTask.attachments || []);
                normalizedTask.deliverables = normalizeArray(normalizedTask.deliverables, baseTask.deliverables || []);
                normalizedTask.comments = normalizeArray(normalizedTask.comments, baseTask.comments || []);
                normalizedTask.history = normalizeArray(normalizedTask.history, baseTask.history || []);
                normalizedTask.importedPlanning = normalizeArray(normalizedTask.importedPlanning, baseTask.importedPlanning || []);
                normalizedTask.dependencies = normalizeArray(normalizedTask.dependencies, baseTask.dependencies || []).map(expandDependencyLabel);
                normalizedTask.blockers = normalizeArray(normalizedTask.blockers, baseTask.blockers || []);
                normalizedTask.requesterChecklist = normalizeArray(normalizedTask.requesterChecklist, baseTask.requesterChecklist || []);
                normalizedTask.technicalChecklist = normalizeArray(normalizedTask.technicalChecklist, baseTask.technicalChecklist || []);
                normalizedTask.technicalTests = normalizeArray(normalizedTask.technicalTests, baseTask.technicalTests || []);
                normalizedTask.currentStage = normalizedTask.currentStage || 'pending';
                return normalizedTask;
            });
            return normalizedMilestone;
        });
        return cloned;
    }

    function getFlowData() {
        const stored = readStoredFlowData();
        const normalized = normalizeFlowData(stored || defaultFlowData);
        saveFlowData(normalized);
        return normalized;
    }

    function saveFlowData(data) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            // noop for preview
        }
    }

    function getContext() {
        const data = getFlowData();
        const params = new URLSearchParams(window.location.search);
        const milestoneIndex = clampIndex(params.get('milestone'), data.milestones.length - 1);
        const milestone = data.milestones[milestoneIndex] || data.milestones[0];
        const taskIndex = clampIndex(params.get('task'), milestone.tasks.length - 1);
        const task = milestone.tasks[taskIndex] || milestone.tasks[0];
        return {
            data: data,
            project: data.project,
            milestone: milestone,
            task: task,
            milestoneIndex: milestoneIndex,
            taskIndex: taskIndex,
            stage: getBodyStage()
        };
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function formatDateBr(value) {
        if (!value) return 'Nao definido';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return value;
        return match[3] + '/' + match[2] + '/' + match[1];
    }

    function renderListItems(items, mapper, emptyText) {
        if (!items.length) {
            return '<div class="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">' + escapeHtml(emptyText) + '</div>';
        }
        return items.map(mapper).join('');
    }

    function buildStageUrl(stage, context) {
        const meta = getStageMeta(stage);
        return meta.file + '?milestone=' + context.milestoneIndex + '&task=' + context.taskIndex;
    }

    function patchTask(context, updates) {
        const data = getFlowData();
        const milestone = data.milestones[context.milestoneIndex];
        if (!milestone || !milestone.tasks[context.taskIndex]) return;
        milestone.tasks[context.taskIndex] = Object.assign({}, milestone.tasks[context.taskIndex], updates || {});
        saveFlowData(data);
    }

    function showToast(title, message, type) {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const titleElement = document.getElementById('toast-title');
        const messageElement = document.getElementById('toast-message');
        if (!toast || !icon || !titleElement || !messageElement) return;
        const config = {
            success: { border: 'border-emerald-500', icon: 'fa-solid fa-circle-check text-emerald-600' },
            error: { border: 'border-red-500', icon: 'fa-solid fa-circle-xmark text-red-600' },
            warning: { border: 'border-yellow-500', icon: 'fa-solid fa-triangle-exclamation text-yellow-600' },
            info: { border: 'border-blue-500', icon: 'fa-solid fa-circle-info text-blue-600' }
        };
        const selected = config[type] || config.info;
        toast.className = 'fixed top-24 right-4 z-[70] hidden max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected.border;
        icon.className = selected.icon + ' text-xl';
        titleElement.textContent = title;
        messageElement.textContent = message;
        toast.classList.remove('hidden');
        window.clearTimeout(window.__bevapToastTimeout);
        window.__bevapToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function openModal(config) {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return;
        const accent = config.accent || 'green';
        const accentMap = {
            green: {
                iconBg: 'bg-green-100',
                iconText: 'text-bevap-green',
                confirmButton: 'bg-bevap-green hover:bg-green-700 text-white'
            },
            yellow: {
                iconBg: 'bg-yellow-100',
                iconText: 'text-yellow-600',
                confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white'
            },
            red: {
                iconBg: 'bg-red-100',
                iconText: 'text-red-600',
                confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
            },
            blue: {
                iconBg: 'bg-blue-100',
                iconText: 'text-blue-600',
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
            }
        };
        const selected = accentMap[accent] || accentMap.green;
        const iconMarkup = config.icon
            ? '<div class="flex items-center mb-4">' +
                '<div class="w-12 h-12 ' + selected.iconBg + ' rounded-full flex items-center justify-center mr-4">' +
                    '<i class="' + escapeHtml(config.icon) + ' ' + selected.iconText + ' text-2xl"></i>' +
                '</div>' +
                '<h3 class="text-xl font-montserrat font-bold text-bevap-navy">' + escapeHtml(config.title || 'Confirmação') + '</h3>' +
            '</div>'
            : '<h3 class="text-xl font-montserrat font-bold text-bevap-navy mb-4">' + escapeHtml(config.title || 'Confirmação') + '</h3>';
        modalRoot.innerHTML = '' +
            '<div id="generic-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">' +
                    iconMarkup +
                    '<div class="text-gray-700">' + (config.bodyHtml || '') + '</div>' +
                    '<div class="mt-6 flex justify-end space-x-3">' +
                        '<button type="button" data-modal-close class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>' +
                        '<button type="button" data-modal-confirm class="px-6 py-2 rounded-lg transition-colors font-medium ' + selected.confirmButton + '">' + escapeHtml(config.confirmLabel || 'Confirmar') + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        const modal = document.getElementById('generic-modal');
        modalRoot.querySelector('[data-modal-close]').addEventListener('click', closeModal);
        modalRoot.querySelector('[data-modal-confirm]').addEventListener('click', function () {
            if (typeof config.onConfirm === 'function') config.onConfirm(modalRoot);
        });
        modal.addEventListener('click', function (event) {
            if (event.target === modal) closeModal();
        });
    }

    function closeModal() {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
    }

    function setUiState(state) {
        const banner = document.getElementById('ui-state-banner');
        const overlay = document.getElementById('ui-loading-overlay');
        const errorBox = document.getElementById('ui-error-box');
        if (!banner || !overlay || !errorBox) return;
        banner.className = 'hidden';
        overlay.classList.add('hidden');
        errorBox.classList.add('hidden');
        if (state === 'loading') {
            overlay.classList.remove('hidden');
            banner.className = 'rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800';
            banner.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Carregando dados da atividade e atualizando os indicadores do workflow.';
        } else if (state === 'error') {
            errorBox.classList.remove('hidden');
            banner.className = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800';
            banner.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-2"></i>Estado de erro do prototipo: exibe mensagem transacional, detalhes do bloqueio e CTA de retorno ao planejamento.';
        } else if (state === 'success') {
            banner.className = 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800';
            banner.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Estado de sucesso do prototipo: confirma o registro da acao, atualiza o stage e destaca o proximo passo.';
        }
        document.querySelectorAll('[data-ui-state]').forEach(function (button) {
            const active = button.getAttribute('data-ui-state') === state;
            button.classList.toggle('bg-bevap-navy', active);
            button.classList.toggle('text-white', active);
            button.classList.toggle('border-bevap-navy', active);
            button.classList.toggle('bg-white', !active);
            button.classList.toggle('text-gray-700', !active);
            button.classList.toggle('border-gray-300', !active);
        });
    }

    function renderStateToolbar() {
        return '' +
            '<div class="flex flex-wrap items-center gap-2">' +
                '<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Estados</span>' +
                '<button type="button" data-ui-state="default" class="rounded-full border px-3 py-1 text-xs font-medium">Normal</button>' +
                '<button type="button" data-ui-state="loading" class="rounded-full border px-3 py-1 text-xs font-medium">Loading</button>' +
                '<button type="button" data-ui-state="error" class="rounded-full border px-3 py-1 text-xs font-medium">Erro</button>' +
                '<button type="button" data-ui-state="success" class="rounded-full border px-3 py-1 text-xs font-medium">Sucesso</button>' +
            '</div>';
    }

    function renderStageStepper(context) {
        return '<div class="grid grid-cols-2 gap-2 md:grid-cols-4">' + STAGE_ORDER.map(function (stage, index) {
            const meta = getStageMeta(stage);
            const active = stage === context.stage;
            const completed = STAGE_ORDER.indexOf(context.task.currentStage || 'pending') > index;
            const stateClass = active
                ? 'border-bevap-green bg-green-50 text-bevap-green'
                : completed
                    ? 'border-bevap-gold bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-bevap-green hover:text-bevap-green';
            return '' +
                '<a href="' + buildStageUrl(stage, context) + '" class="rounded-xl border px-4 py-3 transition-colors ' + stateClass + '">' +
                    '<div class="text-xs font-semibold uppercase tracking-wide">Etapa ' + (index + 1) + '</div>' +
                    '<div class="mt-1 font-montserrat text-sm font-bold">' + escapeHtml(meta.shortLabel) + '</div>' +
                '</a>';
        }).join('') + '</div>';
    }

    function renderHeader(context) {
        const stageMeta = getStageMeta(context.stage);
        return '' +
            '<header class="fixed left-0 right-0 top-0 z-50 bg-bevap-navy shadow-lg">' +
                '<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">' +
                    '<div class="flex items-center space-x-4">' +
                        '<div class="flex items-center space-x-2 rounded-lg bg-white px-4 py-1">' +
                            '<img src="../logoBevap.png" class="h-auto w-24" alt="BEVAP">' +
                        '</div>' +
                        '<div class="hidden h-8 w-px bg-gray-400 md:block"></div>' +
                        '<h1 class="hidden font-montserrat text-lg font-semibold text-white md:block">' + escapeHtml(stageMeta.title) + '</h1>' +
                    '</div>' +
                    '<div class="flex items-center space-x-3">' +
                        '<img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Usuario" class="h-9 w-9 rounded-full border-2 border-bevap-gold">' +
                    '</div>' +
                '</div>' +
                '<div class="mx-auto flex h-10 max-w-7xl items-center px-4 text-sm sm:px-6 lg:px-8">' +
                    '<nav class="flex items-center gap-2 text-sm" aria-label="Breadcrumb">' +
                        '<a href="../ux-dashboard.html" class="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"><i class="fa-solid fa-house text-xs"></i><span>Início</span></a>' +
                        '<span class="text-gray-400">/</span>' +
                        '<a href="../ux-planejamento.html" class="text-gray-300 transition-colors hover:text-white">Planejamento</a>' +
                        '<span class="text-gray-400">/</span>' +
                        '<span class="font-medium text-bevap-gold">' + escapeHtml(stageMeta.shortLabel) + '</span>' +
                    '</nav>' +
                '</div>' +
            '</header>';
    }

    function renderHero(context) {
        if (context.stage === 'pending') {
            return '';
        }
        const stageMeta = getStageMeta(context.stage);
        return '' +
            '<section class="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-bevap-navy to-slate-800 text-white shadow-xl">' +
                '<div class="grid gap-6 px-6 py-6 lg:grid-cols-[1.7fr_1fr]">' +
                    '<div class="space-y-4">' +
                        '<div class="flex flex-wrap items-center gap-2">' +
                            '<span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide"><i class="' + stageMeta.icon + '"></i>' + escapeHtml(stageMeta.label) + '</span>' +
                            '<span class="inline-flex items-center rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100">' + escapeHtml(context.task.priority) + '</span>' +
                            '<span class="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">' + escapeHtml(context.milestone.code) + ' - ' + escapeHtml(context.task.code) + '</span>' +
                        '</div>' +
                        '<div>' +
                            '<div class="text-sm text-slate-200">Marco</div>' +
                            '<h2 class="font-montserrat text-2xl font-bold">' + escapeHtml(context.milestone.name) + '</h2>' +
                            '<p class="mt-1 text-sm text-slate-200">Tarefa: ' + escapeHtml(context.task.name) + '</p>' +
                        '</div>' +
                        '<p class="max-w-3xl text-sm text-slate-100">' + escapeHtml(context.task.description) + '</p>' +
                        '<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">' +
                            '<div class="rounded-xl bg-white/10 p-3"><div class="text-xs uppercase tracking-wide text-slate-200">Responsavel</div><div class="mt-1 font-semibold">' + escapeHtml(context.task.responsible) + '</div></div>' +
                            '<div class="rounded-xl bg-white/10 p-3"><div class="text-xs uppercase tracking-wide text-slate-200">Solicitante</div><div class="mt-1 font-semibold">' + escapeHtml(context.task.requester) + '</div></div>' +
                            '<div class="rounded-xl bg-white/10 p-3"><div class="text-xs uppercase tracking-wide text-slate-200">Previsto</div><div class="mt-1 font-semibold">' + formatDateBr(context.task.plannedStart) + ' ate ' + formatDateBr(context.task.plannedEnd) + '</div></div>' +
                            '<div class="rounded-xl bg-white/10 p-3"><div class="text-xs uppercase tracking-wide text-slate-200">Esforco</div><div class="mt-1 font-semibold">' + escapeHtml(context.task.plannedHours) + 'h planejadas</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="space-y-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">' +
                        '<div class="flex items-center justify-between">' +
                            '<div><div class="text-xs uppercase tracking-wide text-slate-200">Projeto</div><div class="mt-1 font-montserrat text-lg font-bold">' + escapeHtml(context.project.title) + '</div></div>' +
                            '<span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">' + escapeHtml(context.project.code) + '</span>' +
                        '</div>' +
                        '<div class="rounded-xl border border-white/10 bg-slate-950/20 p-4">' +
                            renderStateToolbar() +
                            '<div id="ui-state-banner" class="hidden mt-4"></div>' +
                            '<div id="ui-error-box" class="mt-4 hidden rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Erro simulado: dependencia externa nao respondida. Utilize este estado para demonstrar contingencia, retorno ao planejamento e exibicao de mensagens transacionais.</div>' +
                        '</div>' +
                        '<div class="rounded-xl border border-white/10 bg-slate-950/20 p-4">' +
                            '<div class="flex items-center justify-between text-sm text-slate-200"><span>Progresso previsto</span><span>' + escapeHtml(context.task.progress) + '%</span></div>' +
                            '<div class="mt-2 h-2 rounded-full bg-white/15"><div class="h-2 rounded-full bg-bevap-gold" style="width:' + escapeHtml(context.task.progress) + '%"></div></div>' +
                            '<div class="mt-3 text-xs text-slate-200">Transicao entre fases prototipada com query string, dados compartilhados e navegacao direta.</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="border-t border-white/10 px-6 py-4">' + renderStageStepper(context) + '</div>' +
            '</section>';
    }

    function renderSidebar(context) {
        if (context.stage === 'pending') {
            return '' +
                '<div class="sticky top-24 space-y-4">' +
                    '<div class="bg-white rounded-lg shadow-md p-5">' +
                        '<h3 class="font-montserrat font-bold text-lg text-bevap-navy mb-4 flex items-center">' +
                            '<i class="fa-solid fa-project-diagram mr-2 text-bevap-gold"></i>' +
                            'Resumo do Projeto' +
                        '</h3>' +
                        '<div class="space-y-3 text-sm">' +
                            '<div class="flex items-center justify-between pb-2 border-b"><span class="text-gray-600">Código</span><span class="font-mono font-semibold text-bevap-navy">' + escapeHtml(context.project.code) + '</span></div>' +
                            '<div class="pb-2 border-b"><span class="text-gray-600">Título</span><p class="font-medium text-gray-900 mt-1">' + escapeHtml(context.project.title) + '</p></div>' +
                            '<div class="flex items-center justify-between pb-2 border-b"><span class="text-gray-600">Área</span><span class="font-medium text-gray-900">' + escapeHtml(context.project.area || 'TI') + '</span></div>' +
                            '<div class="flex items-center justify-between pb-2 border-b"><span class="text-gray-600">Patrocinador</span><span class="font-medium text-gray-900">' + escapeHtml(context.project.sponsor) + '</span></div>' +
                            '<div class="flex items-center justify-between pb-2 border-b"><span class="text-gray-600">Prioridade</span><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium"><i class="fa-solid fa-circle-exclamation mr-1"></i>' + escapeHtml(context.project.priority || context.task.priority) + '</span></div>' +
                            '<div class="flex items-center justify-between pb-2 border-b"><span class="text-gray-600">Solicitante</span><span class="font-medium text-gray-900">' + escapeHtml(context.task.requester) + '</span></div>' +
                            '<div class="flex items-center justify-between pb-2 border-b"><span class="text-gray-600">Responsável</span><span class="font-medium text-gray-900">' + escapeHtml(context.task.responsible) + '</span></div>' +
                            '<div class="flex items-center justify-between"><span class="text-gray-600">Status</span><span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium"><i class="fa-regular fa-clock mr-1"></i>Aguardando execução</span></div>' +
                        '</div>' +
                        '<div class="mt-4 pt-4 border-t space-y-2">' +
                            '<a href="../ux-planejamento.html" class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-bevap-navy border border-bevap-navy rounded-lg hover:bg-gray-50 transition-colors"><i class="fa-solid fa-timeline mr-2"></i> Linha do Tempo</a>' +
                            '<button type="button" class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-bevap-green border border-bevap-green rounded-lg hover:bg-green-50 transition-colors"><i class="fa-solid fa-paperclip mr-2"></i> Anexos Existentes</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="bg-white rounded-lg shadow-md p-5">' +
                        '<h3 class="font-montserrat font-bold text-lg text-bevap-navy mb-4 flex items-center"><i class="fa-solid fa-list-check mr-2 text-bevap-green"></i>Progresso</h3>' +
                        '<div class="space-y-2 text-sm">' +
                            '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento do projeto concluído</span></div>' +
                            '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>Execução da atividade aguardando início</span></div>' +
                            '<div class="flex items-center text-gray-400"><i class="fa-regular fa-circle mr-2"></i><span>Validação do solicitante</span></div>' +
                            '<div class="flex items-center text-gray-400"><i class="fa-regular fa-circle mr-2"></i><span>Validação técnica TI</span></div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }
        return '' +
            '<div class="space-y-6">' +
                '<div class="rounded-2xl bg-white p-5 shadow-md">' +
                    '<h3 class="font-montserrat text-lg font-bold text-bevap-navy">Resumo do Projeto</h3>' +
                    '<div class="mt-4 space-y-3 text-sm">' +
                        '<div class="flex items-center justify-between border-b pb-2"><span class="text-gray-600">Codigo</span><span class="font-mono font-semibold text-bevap-navy">' + escapeHtml(context.project.code) + '</span></div>' +
                        '<div class="border-b pb-2"><span class="text-gray-600">Objetivo</span><p class="mt-1 text-gray-800">' + escapeHtml(context.project.objective) + '</p></div>' +
                        '<div class="flex items-center justify-between border-b pb-2"><span class="text-gray-600">Patrocinador</span><span class="font-medium text-gray-900">' + escapeHtml(context.project.sponsor) + '</span></div>' +
                        '<div class="flex items-center justify-between border-b pb-2"><span class="text-gray-600">Gerente</span><span class="font-medium text-gray-900">' + escapeHtml(context.project.projectManager) + '</span></div>' +
                        '<div class="flex items-center justify-between"><span class="text-gray-600">Fonte</span><a href="../ux-planejamento.html" class="font-medium text-bevap-green hover:underline">ux-planejamento.html</a></div>' +
                    '</div>' +
                '</div>' +
                '<div class="rounded-2xl bg-white p-5 shadow-md">' +
                    '<h3 class="font-montserrat text-lg font-bold text-bevap-navy">Importado do Planejamento</h3>' +
                    '<div class="mt-4 space-y-3">' + renderListItems(context.task.importedPlanning, function (item) {
                        return '<div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">' + escapeHtml(item) + '</div>';
                    }, 'Nenhuma observacao importada.') + '</div>' +
                '</div>' +
                '<div class="rounded-2xl bg-white p-5 shadow-md">' +
                    '<div class="flex items-center justify-between">' +
                        '<h3 class="font-montserrat text-lg font-bold text-bevap-navy">Entregaveis</h3>' +
                        '<span class="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-bevap-green">' + context.task.deliverables.length + '</span>' +
                    '</div>' +
                    '<div class="mt-4 space-y-3">' + renderListItems(context.task.deliverables, function (item) {
                        return '<div class="rounded-lg border border-gray-200 p-3 text-sm">' +
                            '<div class="font-semibold text-bevap-navy">' + escapeHtml(item.name) + '</div>' +
                            '<div class="mt-1 text-gray-600">Responsavel: ' + escapeHtml(item.owner) + '</div>' +
                            '<div class="mt-1 text-xs text-gray-500">Status: ' + escapeHtml(item.status) + '</div>' +
                        '</div>';
                    }, 'Nenhum entregavel registrado.') + '</div>' +
                '</div>' +
                '<div class="rounded-2xl bg-white p-5 shadow-md">' +
                    '<h3 class="font-montserrat text-lg font-bold text-bevap-navy">Navegação</h3>' +
                    '<div class="mt-4 grid gap-2">' + STAGE_ORDER.map(function (stage) {
                        const meta = getStageMeta(stage);
                        return '<a href="' + buildStageUrl(stage, context) + '" class="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-bevap-green hover:text-bevap-green">' + escapeHtml(meta.label) + '</a>';
                    }).join('') +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function renderAttachments(items) {
        return renderListItems(items, function (item) {
            return '<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">' +
                '<div class="flex items-center gap-3">' +
                    '<span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-bevap-navy"><i class="fa-solid fa-paperclip"></i></span>' +
                    '<div><div class="font-medium text-bevap-navy">' + escapeHtml(item.name) + '</div><div class="text-xs text-gray-500">' + escapeHtml(item.type) + ' - ' + escapeHtml(item.size) + ' - ' + escapeHtml(item.status) + '</div></div>' +
                '</div>' +
                '<button type="button" class="rounded-lg border border-bevap-green px-3 py-1.5 text-xs font-medium text-bevap-green hover:bg-green-50">Visualizar</button>' +
            '</div>';
        }, 'Nenhum anexo registrado.');
    }

    function renderComments(items) {
        return renderListItems(items, function (item) {
            return '<div class="rounded-xl border border-gray-200 bg-white p-4">' +
                '<div class="flex items-center justify-between gap-2"><div class="font-semibold text-bevap-navy">' + escapeHtml(item.actor) + '</div><div class="text-xs text-gray-500">' + escapeHtml(item.when) + '</div></div>' +
                '<p class="mt-2 text-sm text-gray-700">' + escapeHtml(item.note) + '</p>' +
            '</div>';
        }, 'Nenhum comentario registrado.');
    }

    function renderExecutionComments(items) {
        return renderListItems(items, function (item) {
            return '<div class="execution-comment-item rounded-xl border border-gray-200 bg-white p-4" data-actor="' + escapeHtml(item.actor) + '" data-when="' + escapeHtml(item.when) + '" data-note="' + escapeHtml(item.note) + '">' +
                '<div class="flex items-center justify-between gap-2"><div class="font-semibold text-bevap-navy">' + escapeHtml(item.actor) + '</div><div class="text-xs text-gray-500">' + escapeHtml(item.when) + '</div></div>' +
                '<p class="mt-2 text-sm text-gray-700">' + escapeHtml(item.note) + '</p>' +
            '</div>';
        }, 'Nenhum comentário registrado.');
    }

    function renderHistory(items) {
        return renderListItems(items, function (item) {
            return '<div class="rounded-xl border border-gray-200 bg-gray-50 p-4">' +
                '<div class="flex items-center justify-between gap-2"><div class="font-semibold text-bevap-navy">' + escapeHtml(item.title) + '</div><div class="text-xs text-gray-500">' + escapeHtml(item.when) + '</div></div>' +
                '<div class="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">' + escapeHtml(item.actor) + '</div>' +
                '<p class="mt-2 text-sm text-gray-700">' + escapeHtml(item.detail) + '</p>' +
            '</div>';
        }, 'Nenhum evento registrado.');
    }

    function renderPendingStage(context) {
        return '' +
            '<div class="space-y-6">' +
                '<section id="pending-form" class="bg-white rounded-lg shadow-md">' +
                    '<div id="pending-form-tabs" class="border-b border-gray-200 mb-6">' +
                        '<div class="relative">' +
                            '<div id="pending-form-tabs-scroll" class="flex overflow-x-auto scroll-smooth pr-14 pl-14 md:pl-0 md:pr-2">' +
                                '<button type="button" id="tab-pending-detail" class="px-6 py-4 text-sm font-medium border-b-2 border-bevap-green text-bevap-green bg-green-50 whitespace-nowrap">' +
                                    '<i class="fa-solid fa-clipboard-list mr-2"></i>Detalhamento da Atividade' +
                                '</button>' +
                                '<button type="button" id="tab-pending-info" class="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">' +
                                    '<i class="fa-solid fa-diagram-project mr-2"></i>Informações do Marco e Planejamento' +
                                '</button>' +
                            '</div>' +
                            '<button id="pending-form-tabs-left-arrow" type="button" class="absolute left-0 top-0 bottom-0 w-24 rounded-r-full rounded-l-md border-0 bg-gradient-to-r from-white via-white/80 to-transparent shadow-none text-bevap-navy opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-start pl-2">' +
                                '<span class="flex items-center gap-0 text-base leading-none">' +
                                    '<i class="fa-solid fa-chevron-left"></i>' +
                                    '<i class="fa-solid fa-chevron-left"></i>' +
                                '</span>' +
                            '</button>' +
                            '<button id="pending-form-tabs-right-arrow" type="button" class="absolute right-0 top-0 bottom-0 w-24 rounded-l-full rounded-r-md border-0 bg-gradient-to-l from-white via-white/80 to-transparent shadow-none text-bevap-navy opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-end pr-2">' +
                                '<span class="flex items-center gap-0 text-base leading-none">' +
                                    '<i class="fa-solid fa-chevron-right"></i>' +
                                    '<i class="fa-solid fa-chevron-right"></i>' +
                                '</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="tab-content-pending-detail" class="p-6">' +
                        '<div class="space-y-6">' +
                            '<div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">' +
                                '<div class="h-1 w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200"></div>' +
                                '<div class="px-5 py-4">' +
                                '<div class="space-y-4">' +
                                    '<div class="flex items-start justify-between gap-4">' +
                                        '<div class="min-w-0 flex-1">' +
                                            '<div class="flex items-start gap-3 min-w-0">' +
                                                '<span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-50 text-yellow-700 shrink-0">' +
                                                    '<i class="fa-regular fa-clock text-sm"></i>' +
                                                '</span>' +
                                                '<div class="min-w-0">' +
                                                    '<div class="text-base font-semibold text-bevap-navy leading-6">' + escapeHtml(context.task.name) + '</div>' +
                                                    '<div class="mt-1 text-sm text-gray-500">Atividade aguardando início da execução.</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="shrink-0 pt-0.5">' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500 mb-2">Status</div>' +
                                            '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-yellow-300 bg-yellow-50 text-yellow-800 text-xs font-semibold rounded-full whitespace-nowrap">' +
                                                '<i class="fa-regular fa-clock"></i>' +
                                                '<span>Aguardando execução</span>' +
                                            '</span>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="flex flex-nowrap items-center gap-2 overflow-x-auto text-gray-600 pb-1" style="font-size: 13px;">' +
                                            '<span class="inline-flex items-center px-3 py-1.5 rounded-full bg-bevap-navy border border-bevap-navy text-white whitespace-nowrap shrink-0">' +
                                                '<i class="fa-solid fa-user mr-1 text-blue-100"></i>' +
                                                '<span>Responsável: ' + escapeHtml(context.task.responsible) + '</span>' +
                                            '</span>' +
                                            '<span class="inline-flex items-center px-3 py-1.5 rounded-full border text-white whitespace-nowrap shrink-0" style="background-color: #15803D; border-color: #15803D;">' +
                                                '<i class="fa-solid fa-layer-group mr-1 text-green-200"></i>' +
                                                '<span>Fase: ' + escapeHtml(context.task.phaseName) + '</span>' +
                                            '</span>' +
                                            '<span class="inline-flex items-center px-3 py-1.5 rounded-full border text-white whitespace-nowrap shrink-0" style="background-color: #c20014; border-color: #c20014;">' +
                                                '<i class="fa-solid fa-calendar-alt mr-1 text-red-100"></i>' +
                                                '<span>' + formatDateBr(context.task.plannedStart) + '</span>' +
                                            '</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">' +
                                    '<div class="grid gap-3 sm:grid-cols-3">' +
                                        '<div>' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500">Esforço Estimado</div>' +
                                            '<div class="mt-1 text-base font-semibold text-blue-700">' + escapeHtml(context.task.plannedHours) + 'h</div>' +
                                        '</div>' +
                                        '<div>' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500">Esforço Utilizado</div>' +
                                            '<div class="mt-1 text-base font-semibold text-blue-700">' + escapeHtml(context.task.actualHours || 0) + 'h</div>' +
                                        '</div>' +
                                        '<div>' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500">Horas Restantes</div>' +
                                            '<div class="mt-1 text-base font-semibold text-blue-700">' + escapeHtml(Math.max((Number(context.task.plannedHours) || 0) - (Number(context.task.actualHours) || 0), 0)) + 'h</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">' +
                                '<div class="flex items-center mb-2">' +
                                    '<i class="fa-solid fa-link text-yellow-600 mr-2"></i>' +
                                    '<h4 class="text-sm font-montserrat font-semibold text-gray-900">Dependências da Tarefa</h4>' +
                                '</div>' +
                                '<div class="space-y-2">' + renderListItems(context.task.dependencies || [], function (item) {
                                    return '<div class="flex items-center gap-2 text-sm text-gray-700"><i class="fa-solid fa-triangle-exclamation text-yellow-500"></i><span>' + escapeHtml(item) + '</span></div>';
                                }, 'Nenhuma dependência cadastrada na EAP para esta tarefa.') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="tab-content-pending-info" class="p-6 hidden">' +
                        '<div class="space-y-4">' +
                            '<div class="rounded-xl border border-gray-200 bg-white p-4">' +
                                '<div class="flex items-center gap-3">' +
                                    '<span class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 shrink-0">' +
                                        '<i class="fa-solid fa-flag text-base"></i>' +
                                    '</span>' +
                                    '<div class="min-w-0">' +
                                        '<div class="text-sm font-semibold text-gray-500">Marco</div>' +
                                        '<div class=" text-base font-semibold text-bevap-navy leading-7">' + escapeHtml(context.milestone.name) + '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">' +
                                '<div class="rounded-xl border border-gray-200 bg-white p-4 h-full">' +
                                    '<div class="flex items-center gap-3">' +
                                        '<span class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-500 shrink-0">' +
                                            '<i class="fa-solid fa-calendar-days text-base"></i>' +
                                        '</span>' +
                                        '<div class="min-w-0">' +
                                            '<div class="text-sm font-semibold text-gray-500">Período do Marco</div>' +
                                            '<div class="text-base font-semibold text-bevap-navy leading-7">' + escapeHtml(String(context.milestone.period || '').replace(/\s*-\s*/g, ' ate ')) + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="rounded-xl border border-gray-200 bg-white p-4 h-full">' +
                                    '<div class="flex items-center gap-3">' +
                                        '<span class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-500 shrink-0">' +
                                            '<i class="fa-solid fa-user text-base"></i>' +
                                        '</span>' +
                                        '<div class="min-w-0">' +
                                            '<div class="text-sm font-semibold text-gray-500">Solicitante</div>' +
                                            '<div class="text-base font-semibold text-bevap-navy leading-7">' + escapeHtml(context.task.requester) + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mt-6">' +
                            '<h4 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Critérios de aceite do marco</h4>' +
                            '<div class="space-y-2">' + renderListItems(context.milestone.acceptanceCriteria, function (item) {
                                return '<div class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-700"><i class="fa-solid fa-check text-[10px] text-bevap-green"></i><span>' + escapeHtml(item) + '</span></div>';
                            }, 'Nenhum critério cadastrado.') + '</div>' +
                        '</div>' +
                    '</div>' +
                '</section>' +
            '</div>';
    }

    function renderPendingFooter(context) {
        return '' +
            '<footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">' +
                '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">' +
                    '<div class="flex justify-end">' +
                        '<button type="button" data-action="start-execution" class="px-6 py-2.5 text-sm font-medium text-white bg-bevap-green rounded-lg hover:bg-green-700 transition-all shadow-md inline-flex items-center">' +
                            '<i class="fa-solid fa-paper-plane mr-2"></i> Iniciar Execução' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</footer>';
    }

    function renderExecutionStage(context) {
        const executionStatusLabel = !context.task.statusLabel || context.task.statusLabel === 'Pendente para início'
            ? 'Em execução'
            : context.task.statusLabel;
        return '' +
            '<div class="space-y-6">' +
                '<section id="execution-panel" class="bg-white rounded-lg shadow-md">' +
                    '<div id="execution-panel-tabs" class="border-b border-gray-200 mb-6">' +
                        '<div class="relative">' +
                            '<div id="execution-panel-tabs-scroll" class="flex overflow-x-auto scroll-smooth pr-14 pl-14 md:pl-0 md:pr-2">' +
                                '<button type="button" id="tab-execution-detail" class="px-6 py-4 text-sm font-medium border-b-2 border-bevap-green text-bevap-green bg-green-50 whitespace-nowrap">' +
                                    '<i class="fa-solid fa-clipboard-list mr-2"></i>Detalhamento da Atividade' +
                                '</button>' +
                                '<button type="button" id="tab-execution-info" class="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">' +
                                    '<i class="fa-solid fa-diagram-project mr-2"></i>Informações do Marco e Planejamento' +
                                '</button>' +
                            '</div>' +
                            '<button id="execution-panel-tabs-left-arrow" type="button" class="absolute left-0 top-0 bottom-0 w-24 rounded-r-full rounded-l-md border-0 bg-gradient-to-r from-white via-white/80 to-transparent shadow-none text-bevap-navy opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-start pl-2">' +
                                '<span class="flex items-center gap-0 text-base leading-none">' +
                                    '<i class="fa-solid fa-chevron-left"></i>' +
                                    '<i class="fa-solid fa-chevron-left"></i>' +
                                '</span>' +
                            '</button>' +
                            '<button id="execution-panel-tabs-right-arrow" type="button" class="absolute right-0 top-0 bottom-0 w-24 rounded-l-full rounded-r-md border-0 bg-gradient-to-l from-white via-white/80 to-transparent shadow-none text-bevap-navy opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-end pr-2">' +
                                '<span class="flex items-center gap-0 text-base leading-none">' +
                                    '<i class="fa-solid fa-chevron-right"></i>' +
                                    '<i class="fa-solid fa-chevron-right"></i>' +
                                '</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="tab-content-execution-detail" class="p-6">' +
                        '<div class="space-y-6">' +
                            '<div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">' +
                                '<div class="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-200"></div>' +
                                '<div class="px-5 py-4">' +
                                '<div class="space-y-4">' +
                                    '<div class="flex items-start justify-between gap-4">' +
                                        '<div class="min-w-0 flex-1">' +
                                            '<div class="flex items-start gap-3 min-w-0">' +
                                                '<span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 shrink-0">' +
                                                    '<i class="fa-solid fa-play text-sm"></i>' +
                                                '</span>' +
                                                '<div class="min-w-0">' +
                                                    '<div class="text-base font-semibold text-bevap-navy leading-6">' + escapeHtml(context.task.name) + '</div>' +
                                                    '<div class="mt-1 text-sm text-gray-500">Atividade em execução com andamento operacional registrado.</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="shrink-0 pt-0.5">' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500 mb-2">Status</div>' +
                                            '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-800 text-xs font-semibold rounded-full whitespace-nowrap">' +
                                                '<i class="fa-solid fa-play"></i>' +
                                                '<span>' + escapeHtml(executionStatusLabel) + '</span>' +
                                            '</span>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="flex flex-nowrap items-center gap-2 overflow-x-auto text-gray-600 pb-1" style="font-size: 13px;">' +
                                            '<span class="inline-flex items-center px-3 py-1.5 rounded-full bg-bevap-navy border border-bevap-navy text-white whitespace-nowrap shrink-0">' +
                                                '<i class="fa-solid fa-user mr-1 text-blue-100"></i>' +
                                                '<span>Responsável: ' + escapeHtml(context.task.responsible) + '</span>' +
                                            '</span>' +
                                            '<span class="inline-flex items-center px-3 py-1.5 rounded-full border text-white whitespace-nowrap shrink-0" style="background-color: #15803D; border-color: #15803D;">' +
                                                '<i class="fa-solid fa-layer-group mr-1 text-green-200"></i>' +
                                                '<span>Fase: ' + escapeHtml(context.task.phaseName) + '</span>' +
                                            '</span>' +
                                            '<span class="inline-flex items-center px-3 py-1.5 rounded-full border text-white whitespace-nowrap shrink-0" style="background-color: #c20014; border-color: #c20014;">' +
                                                '<i class="fa-solid fa-calendar-alt mr-1 text-red-100"></i>' +
                                                '<span>' + formatDateBr(context.task.plannedStart) + '</span>' +
                                            '</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">' +
                                    '<div class="grid gap-3 sm:grid-cols-3">' +
                                        '<div>' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500">Esforço Estimado</div>' +
                                            '<div class="mt-1 text-base font-semibold text-blue-700">' + escapeHtml(context.task.plannedHours) + 'h</div>' +
                                        '</div>' +
                                        '<div>' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500">Esforço Utilizado</div>' +
                                            '<div class="mt-1 text-base font-semibold text-blue-700">' + escapeHtml(context.task.actualHours || 0) + 'h</div>' +
                                        '</div>' +
                                        '<div>' +
                                            '<div class="text-xs uppercase tracking-wide text-gray-500">Horas Restantes</div>' +
                                            '<div class="mt-1 text-base font-semibold text-blue-700">' + escapeHtml(Math.max((Number(context.task.plannedHours) || 0) - (Number(context.task.actualHours) || 0), 0)) + 'h</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">' +
                                '<div class="flex items-center mb-2">' +
                                    '<i class="fa-solid fa-link text-yellow-600 mr-2"></i>' +
                                    '<h4 class="text-sm font-montserrat font-semibold text-gray-900">Dependências da Tarefa</h4>' +
                                '</div>' +
                                '<div class="space-y-2">' + renderListItems(context.task.dependencies || [], function (item) {
                                    return '<div class="flex items-center gap-2 text-sm text-gray-700"><i class="fa-solid fa-triangle-exclamation text-yellow-500"></i><span>' + escapeHtml(item) + '</span></div>';
                                }, 'Nenhuma dependência cadastrada na EAP para esta tarefa.') + '</div>' +
                            '</div>' +
                            '<div class="rounded-xl border border-gray-200 bg-white p-4">' +
                                '<div class="flex items-center justify-between gap-3">' +
                                    '<h4 class="text-sm font-montserrat font-semibold text-gray-900">Comentários da Atividade</h4>' +
                                    '<span class="text-xs text-gray-500">Vários comentários</span>' +
                                '</div>' +
                                '<div id="execution-comments-list" class="mt-4 space-y-3">' + renderExecutionComments(context.task.comments || []) + '</div>' +
                                '<div class="mt-4">' +
                                    '<label for="execution-comment" class="mb-2 block text-sm font-medium text-gray-700">Novo comentário *</label>' +
                                    '<textarea id="execution-comment" rows="4" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Descreva o andamento, impedimentos ou decisões tomadas."></textarea>' +
                                '</div>' +
                                '<div id="execution-errors" class="hidden mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"></div>' +
                                '<div class="mt-3 flex justify-end">' +
                                    '<button type="button" data-action="add-execution-comment" class="rounded-lg border border-bevap-navy px-4 py-2 text-sm font-medium text-bevap-navy hover:bg-gray-50">Adicionar comentário</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="tab-content-execution-info" class="p-6 hidden">' +
                        '<div class="space-y-4">' +
                            '<div class="rounded-xl border border-gray-200 bg-white p-4">' +
                                '<div class="flex items-center gap-3">' +
                                    '<span class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 shrink-0">' +
                                        '<i class="fa-solid fa-flag text-base"></i>' +
                                    '</span>' +
                                    '<div class="min-w-0">' +
                                        '<div class="text-sm font-semibold text-gray-500">Marco</div>' +
                                        '<div class=" text-base font-semibold text-bevap-navy leading-7">' + escapeHtml(context.milestone.name) + '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">' +
                                '<div class="rounded-xl border border-gray-200 bg-white p-4 h-full">' +
                                    '<div class="flex items-center gap-3">' +
                                        '<span class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-500 shrink-0">' +
                                            '<i class="fa-solid fa-calendar-days text-base"></i>' +
                                        '</span>' +
                                        '<div class="min-w-0">' +
                                            '<div class="text-sm font-semibold text-gray-500">Período do Marco</div>' +
                                            '<div class="text-base font-semibold text-bevap-navy leading-7">' + escapeHtml(String(context.milestone.period || '').replace(/\s*-\s*/g, ' ate ')) + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="rounded-xl border border-gray-200 bg-white p-4 h-full">' +
                                    '<div class="flex items-center gap-3">' +
                                        '<span class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-500 shrink-0">' +
                                            '<i class="fa-solid fa-user text-base"></i>' +
                                        '</span>' +
                                        '<div class="min-w-0">' +
                                            '<div class="text-sm font-semibold text-gray-500">Solicitante</div>' +
                                            '<div class="text-base font-semibold text-bevap-navy leading-7">' + escapeHtml(context.task.requester) + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="mt-6">' +
                                '<h4 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Critérios de aceite do marco</h4>' +
                                '<div class="space-y-2">' + renderListItems(context.milestone.acceptanceCriteria, function (item) {
                                    return '<div class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-700"><i class="fa-solid fa-check text-[10px] text-bevap-green"></i><span>' + escapeHtml(item) + '</span></div>';
                                }, 'Nenhum critério cadastrado.') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</section>' +
            '</div>';
    }

    function renderExecutionFooter(context) {
        return '' +
            '<footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">' +
                '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">' +
                    '<div class="flex justify-end">' +
                        '<button type="button" data-action="send-requester" class="px-6 py-2.5 text-sm font-medium text-white bg-bevap-green rounded-lg hover:bg-green-700 transition-all shadow-md inline-flex items-center">' +
                            '<i class="fa-solid fa-paper-plane mr-2"></i> Enviar para Validação do Solicitante' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</footer>';
    }

    function renderRequesterStage(context) {
        return '' +
            '<div class="space-y-6">' +
                '<section class="rounded-2xl bg-white p-6 shadow-md"><div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="font-montserrat text-xl font-bold text-bevap-navy">Aprovacao do solicitante</h3><p class="mt-1 text-sm text-gray-600">Visualizacao dos entregaveis, historico da execucao e decisao de negocio com feedback formal.</p></div><span class="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">Validacao do solicitante</span></div></section>' +
                '<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">' +
                    '<div class="space-y-6">' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Entregaveis apresentados</h3><div class="mt-4 space-y-3">' + renderListItems(context.task.deliverables, function (item) {
                            return '<div class="rounded-xl border border-gray-200 bg-gray-50 p-4"><div class="flex items-center justify-between gap-2"><div class="font-semibold text-bevap-navy">' + escapeHtml(item.name) + '</div><span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">' + escapeHtml(item.status) + '</span></div><div class="mt-2 text-sm text-gray-600">Responsavel: ' + escapeHtml(item.owner) + '</div></div>';
                        }, 'Nenhum entregavel informado.') + '</div><div class="mt-6"><h4 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Anexos de apoio</h4><div class="mt-3 space-y-3">' + renderAttachments(context.task.attachments) + '</div></div></section>' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Historico da execucao</h3><div class="mt-4 space-y-3">' + renderComments(context.task.comments.concat(context.task.history.map(function (entry) {
                            return { actor: entry.actor, when: entry.when, note: entry.title + ': ' + entry.detail };
                        }))) + '</div></section>' +
                    '</div>' +
                    '<div class="space-y-6">' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Checklist do solicitante</h3><div class="mt-4 space-y-3">' + renderListItems(context.task.requesterChecklist, function (item, index) {
                            return '<label class="flex items-start gap-3 rounded-lg border border-gray-200 p-4"><input type="checkbox" class="requester-checklist mt-1 h-4 w-4 rounded border-gray-300 text-bevap-green focus:ring-bevap-green" data-check-index="' + index + '"><span class="text-sm text-gray-700">' + escapeHtml(item) + '</span></label>';
                        }, 'Nenhum item de validacao configurado.') + '</div></section>' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><div id="requester-errors" class="hidden mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"></div><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Decisao do solicitante</h3><div class="mt-4 space-y-3"><label class="flex items-start gap-3 rounded-lg border border-gray-200 p-4"><input type="radio" name="requester-decision" value="approve" class="mt-1 h-4 w-4 border-gray-300 text-bevap-green focus:ring-bevap-green"><span><span class="block font-medium text-gray-900">Aprovar atividade</span><span class="text-sm text-gray-600">Encaminha a atividade para validacao tecnica da TI.</span></span></label><label class="flex items-start gap-3 rounded-lg border border-gray-200 p-4"><input type="radio" name="requester-decision" value="reject" class="mt-1 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"><span><span class="block font-medium text-gray-900">Reprovar atividade</span><span class="text-sm text-gray-600">Registra a justificativa e sinaliza retorno para correcoes, sem abrir tela adicional.</span></span></label></div><div class="mt-4"><label class="mb-2 block text-sm font-medium text-gray-700">Feedback do solicitante *</label><textarea id="requester-feedback" rows="4" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Descreva o resultado da validacao, pontos aprovados e feedback para o time.">Entregaveis aderentes ao combinado; autorizo o envio para validacao tecnica.</textarea></div><div class="mt-4"><label class="mb-2 block text-sm font-medium text-gray-700">Justificativa de reprovacao</label><textarea id="requester-rejection" rows="4" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Obrigatorio somente em caso de reprovacao."></textarea></div><div class="mt-6 flex flex-col gap-3"><button type="button" data-action="submit-requester-decision" class="rounded-lg bg-bevap-green px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">Registrar decisao</button><a href="' + buildStageUrl('execution', context) + '" class="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-100">Voltar para execucao</a></div></section>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function renderTiStage(context) {
        return '' +
            '<div class="space-y-6">' +
                '<section class="rounded-2xl bg-white p-6 shadow-md"><div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="font-montserrat text-xl font-bold text-bevap-navy">Validacao tecnica da atividade</h3><p class="mt-1 text-sm text-gray-600">Checklist tecnico, testes realizados, aderencia aos requisitos e aprovacao final sem criar telas de correcao ou cancelamento.</p></div><span class="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">Validacao tecnica</span></div></section>' +
                '<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">' +
                    '<div class="space-y-6">' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Checklist tecnico</h3><div class="mt-4 space-y-3">' + renderListItems(context.task.technicalChecklist, function (item, index) {
                            return '<label class="flex items-start gap-3 rounded-lg border border-gray-200 p-4"><input type="checkbox" class="ti-checklist mt-1 h-4 w-4 rounded border-gray-300 text-bevap-green focus:ring-bevap-green" data-ti-check-index="' + index + '"><span class="text-sm text-gray-700">' + escapeHtml(item) + '</span></label>';
                        }, 'Nenhum item tecnico configurado.') + '</div></section>' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Testes realizados</h3><div class="mt-4 space-y-3">' + renderListItems(context.task.technicalTests, function (item) {
                            return '<div class="rounded-xl border border-gray-200 bg-gray-50 p-4"><div class="flex items-center justify-between gap-2"><div class="font-semibold text-bevap-navy">' + escapeHtml(item.name) + '</div><span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">' + escapeHtml(item.result) + '</span></div><p class="mt-2 text-sm text-gray-700">' + escapeHtml(item.note) + '</p></div>';
                        }, 'Nenhum teste registrado.') + '</div></section>' +
                    '</div>' +
                    '<div class="space-y-6">' +
                        '<section class="rounded-2xl bg-white p-6 shadow-md"><div id="ti-errors" class="hidden mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"></div><h3 class="font-montserrat text-lg font-bold text-bevap-navy">Parecer final da TI</h3><div class="mt-4 space-y-4"><div><label class="mb-2 block text-sm font-medium text-gray-700">Status tecnico *</label><select id="ti-status" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green"><option value="">Selecione</option><option value="approved" selected>Aprovado tecnicamente</option><option value="conditional">Aprovado com ressalvas</option><option value="rejected">Reprovado</option></select></div><div><label class="mb-2 block text-sm font-medium text-gray-700">Conclusao tecnica *</label><textarea id="ti-conclusion" rows="4" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Registre o parecer tecnico final.">Requisitos tecnicos atendidos, testes essenciais executados e atividade pronta para encerramento do marco.</textarea></div><div><label class="mb-2 block text-sm font-medium text-gray-700">Ressalvas / justificativa de reprovacao</label><textarea id="ti-justification" rows="4" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Obrigatorio para reprovar ou aprovar com ressalvas."></textarea></div><div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><i class="fa-solid fa-circle-info mr-2"></i>As acoes de reprovacao ficam restritas a modal e feedback. Nenhuma tela de correcao ou cancelamento e criada neste prototipo.</div><div class="flex flex-col gap-3"><button type="button" data-action="submit-ti-decision" class="rounded-lg bg-bevap-green px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">Registrar validacao tecnica</button><a href="' + buildStageUrl('requester', context) + '" class="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-100">Voltar para validacao do solicitante</a></div></div></section>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function renderDocsStage(context) {
        return '' +
            '<div class="space-y-6">' +
                '<section class="rounded-2xl bg-white p-6 shadow-md"><h3 class="font-montserrat text-xl font-bold text-bevap-navy">Documentacao de interacoes e navegacao</h3><p class="mt-2 text-sm text-gray-600">Este arquivo resume os prototipos entregues, os estados suportados e a navegacao entre as fases do fluxo de execucao dos marcos.</p></section>' +
                '<section class="grid gap-6 md:grid-cols-2">' +
                    '<div class="rounded-2xl bg-white p-6 shadow-md"><h4 class="font-montserrat text-lg font-bold text-bevap-navy">Arquivos do prototipo</h4><div class="mt-4 space-y-3">' +
                        '<a href="../ux-planejamento.html" class="block rounded-lg border border-gray-200 p-4 text-sm text-gray-700 hover:border-bevap-green hover:text-bevap-green">ux-planejamento.html - origem do fluxo, cronograma, marcos e CTA para abrir as tarefas.</a>' +
                        '<a href="ux-marco-aguardando-execucao.html?milestone=' + context.milestoneIndex + '&task=' + context.taskIndex + '" class="block rounded-lg border border-gray-200 p-4 text-sm text-gray-700 hover:border-bevap-green hover:text-bevap-green">ux-marco-aguardando-execucao.html - validacao inicial e checklist de liberacao.</a>' +
                        '<a href="ux-marco-execucao-atividade.html?milestone=' + context.milestoneIndex + '&task=' + context.taskIndex + '" class="block rounded-lg border border-gray-200 p-4 text-sm text-gray-700 hover:border-bevap-green hover:text-bevap-green">ux-marco-execucao-atividade.html - operacao, anexos, comentarios, progresso e timer.</a>' +
                        '<a href="ux-marco-validacao-solicitante.html?milestone=' + context.milestoneIndex + '&task=' + context.taskIndex + '" class="block rounded-lg border border-gray-200 p-4 text-sm text-gray-700 hover:border-bevap-green hover:text-bevap-green">ux-marco-validacao-solicitante.html - aprovacao do solicitante com feedback e justificativas.</a>' +
                        '<a href="ux-marco-validacao-ti.html?milestone=' + context.milestoneIndex + '&task=' + context.taskIndex + '" class="block rounded-lg border border-gray-200 p-4 text-sm text-gray-700 hover:border-bevap-green hover:text-bevap-green">ux-marco-validacao-ti.html - checklist tecnico, testes e parecer final.</a>' +
                    '</div></div>' +
                    '<div class="rounded-2xl bg-white p-6 shadow-md"><h4 class="font-montserrat text-lg font-bold text-bevap-navy">Fluxo de navegacao</h4><div class="mt-4 space-y-3 text-sm text-gray-700">' +
                        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">1. O usuario inicia em ux-planejamento.html, revisa cronograma e abre a tarefa pelo CTA do marco ou conclui o planejamento.</div>' +
                        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">2. A tela de aguardando execucao valida entradas obrigatorias e abre a execucao operacional.</div>' +
                        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">3. A execucao registra comentarios, anexos, progresso e envio para o solicitante.</div>' +
                        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">4. A validacao do solicitante aprova e encaminha para TI, ou reprova via modal com justificativa sem abrir nova tela.</div>' +
                        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">5. A validacao de TI encerra tecnicamente a tarefa ou registra reprovacao com ressalvas no proprio prototipo.</div>' +
                    '</div></div>' +
                '</section>' +
                '<section class="grid gap-6 md:grid-cols-2">' +
                    '<div class="rounded-2xl bg-white p-6 shadow-md"><h4 class="font-montserrat text-lg font-bold text-bevap-navy">Estados de interface</h4><div class="mt-4 space-y-3 text-sm text-gray-700"><div class="rounded-lg border border-gray-200 p-4">Normal: apresenta o formulario e os dados do planejamento.</div><div class="rounded-lg border border-gray-200 p-4">Loading: overlay e banner de processamento.</div><div class="rounded-lg border border-gray-200 p-4">Erro: banner vermelho e box de contingencia.</div><div class="rounded-lg border border-gray-200 p-4">Sucesso: confirmacao visual da acao e destaque do proximo passo.</div></div></div>' +
                    '<div class="rounded-2xl bg-white p-6 shadow-md"><h4 class="font-montserrat text-lg font-bold text-bevap-navy">Validacoes obrigatorias</h4><div class="mt-4 space-y-3 text-sm text-gray-700"><div class="rounded-lg border border-gray-200 p-4">Aguardando execucao: checklist de liberacao e briefing inicial.</div><div class="rounded-lg border border-gray-200 p-4">Execucao: status, progresso, comentario operacional e proximo passo.</div><div class="rounded-lg border border-gray-200 p-4">Solicitante: decisao, feedback e justificativa quando houver reprovacao.</div><div class="rounded-lg border border-gray-200 p-4">TI: checklist tecnico, status final, conclusao e justificativa para reprovar/ressalvar.</div></div></div>' +
                '</section>' +
            '</div>';
    }

    function renderStageContent(context) {
        if (context.stage === 'execution') return renderExecutionStage(context);
        if (context.stage === 'requester') return renderRequesterStage(context);
        if (context.stage === 'ti') return renderTiStage(context);
        if (context.stage === 'docs') return renderDocsStage(context);
        return renderPendingStage(context);
    }

    function bindCommonEvents() {
        document.querySelectorAll('[data-ui-state]').forEach(function (button) {
            button.addEventListener('click', function () {
                setUiState(button.getAttribute('data-ui-state'));
            });
        });
    }

    function setError(containerId, messages) {
        const target = document.getElementById(containerId);
        if (!target) return false;
        if (!messages.length) {
            target.classList.add('hidden');
            target.innerHTML = '';
            return false;
        }
        target.classList.remove('hidden');
        target.innerHTML = '<div class="font-semibold">Ajuste os campos obrigatorios:</div><ul class="mt-2 list-disc space-y-1 pl-5">' + messages.map(function (message) {
            return '<li>' + escapeHtml(message) + '</li>';
        }).join('') + '</ul>';
        return true;
    }

    function navigateWithToast(title, message, type, targetUrl, updater) {
        if (typeof updater === 'function') updater();
        showToast(title, message, type);
        window.setTimeout(function () {
            window.location.href = targetUrl;
        }, 900);
    }

    function bindPendingEvents(context) {
        function switchPendingTab(tabName) {
            const tabs = ['detail', 'info'];
            tabs.forEach(function (tab) {
                const tabButton = document.getElementById('tab-pending-' + tab);
                const tabContent = document.getElementById('tab-content-pending-' + tab);
                if (!tabButton || !tabContent) return;
                const active = tab === tabName;
                tabButton.classList.toggle('border-bevap-green', active);
                tabButton.classList.toggle('text-bevap-green', active);
                tabButton.classList.toggle('bg-green-50', active);
                tabButton.classList.toggle('border-transparent', !active);
                tabButton.classList.toggle('text-gray-500', !active);
                tabButton.classList.toggle('hover:text-gray-700', !active);
                tabContent.classList.toggle('hidden', !active);
            });
        }

        function updatePendingTabsArrows() {
            const scroller = document.getElementById('pending-form-tabs-scroll');
            const leftArrow = document.getElementById('pending-form-tabs-left-arrow');
            const rightArrow = document.getElementById('pending-form-tabs-right-arrow');
            if (!scroller || !leftArrow || !rightArrow) return;

            const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            const hasOverflow = maxScroll > 2;
            const atStart = scroller.scrollLeft <= 2;
            const atEnd = scroller.scrollLeft >= maxScroll - 2;

            leftArrow.classList.toggle('opacity-0', !hasOverflow || atStart);
            leftArrow.classList.toggle('pointer-events-none', !hasOverflow || atStart);
            rightArrow.classList.toggle('opacity-0', !hasOverflow || atEnd);
            rightArrow.classList.toggle('pointer-events-none', !hasOverflow || atEnd);
        }

        function scrollPendingTabs(direction) {
            const scroller = document.getElementById('pending-form-tabs-scroll');
            if (!scroller) return;
            const target = direction === 'right'
                ? (scroller.scrollWidth - scroller.clientWidth)
                : 0;
            scroller.scrollTo({ left: target, behavior: 'smooth' });
            window.setTimeout(updatePendingTabsArrows, 360);
        }

        document.getElementById('tab-pending-detail')?.addEventListener('click', function () {
            switchPendingTab('detail');
        });
        document.getElementById('tab-pending-info')?.addEventListener('click', function () {
            switchPendingTab('info');
        });
        document.getElementById('pending-form-tabs-left-arrow')?.addEventListener('click', function () {
            scrollPendingTabs('left');
        });
        document.getElementById('pending-form-tabs-right-arrow')?.addEventListener('click', function () {
            scrollPendingTabs('right');
        });
        document.getElementById('pending-form-tabs-scroll')?.addEventListener('scroll', updatePendingTabsArrows);
        window.setTimeout(updatePendingTabsArrows, 0);
        switchPendingTab('detail');

        const saveDraftButton = document.querySelector('[data-action="save-pending-draft"]');
        if (saveDraftButton) {
            saveDraftButton.addEventListener('click', function () {
                showToast('Rascunho salvo', 'O contexto atual da atividade foi mantido no protótipo.', 'success');
            });
        }
        const button = document.querySelector('[data-action="start-execution"]');
        if (!button) return;
        button.addEventListener('click', function () {
            openModal({
                title: 'Confirmar Início da Execução',
                icon: 'fa-solid fa-play-circle',
                accent: 'green',
                bodyHtml: '<p class="mb-4">Você está iniciando a atividade <strong>' + escapeHtml(context.task.name) + '</strong> do marco <strong>' + escapeHtml(context.milestone.name) + '</strong>.</p><p class="text-sm text-gray-600">Ao confirmar, a execução da atividade será iniciada e a interface operacional será aberta com os dados do planejamento já carregados.</p>',
                confirmLabel: 'Iniciar Execução',
                onConfirm: function () {
                    closeModal();
                    navigateWithToast('Execução iniciada', 'A atividade avançou para a interface operacional.', 'success', buildStageUrl('execution', context), function () {
                        patchTask(context, { currentStage: 'execution', statusLabel: 'Em execução' });
                    });
                }
            });
        });
    }

    function bindExecutionEvents(context) {
        function renderExecutionCommentItem(comment) {
            return '<div class="execution-comment-item rounded-xl border border-gray-200 bg-white p-4" data-actor="' + escapeHtml(comment.actor) + '" data-when="' + escapeHtml(comment.when) + '" data-note="' + escapeHtml(comment.note) + '">' +
                '<div class="flex items-center justify-between gap-2"><div class="font-semibold text-bevap-navy">' + escapeHtml(comment.actor) + '</div><div class="text-xs text-gray-500">' + escapeHtml(comment.when) + '</div></div>' +
                '<p class="mt-2 text-sm text-gray-700">' + escapeHtml(comment.note) + '</p>' +
            '</div>';
        }

        function getExecutionComments() {
            return Array.from(document.querySelectorAll('#execution-comments-list .execution-comment-item')).map(function (item) {
                return {
                    actor: item.getAttribute('data-actor') || context.task.responsible,
                    when: item.getAttribute('data-when') || 'Agora',
                    note: item.getAttribute('data-note') || ''
                };
            }).filter(function (item) {
                return item.note && item.note.trim();
            });
        }

        function appendExecutionCommentFromField(clearField) {
            const field = document.getElementById('execution-comment');
            const list = document.getElementById('execution-comments-list');
            if (!field || !list) return false;
            const note = field.value.trim();
            if (!note) return false;
            const now = new Date();
            const when = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            list.insertAdjacentHTML('beforeend', renderExecutionCommentItem({
                actor: context.task.responsible,
                when: when,
                note: note
            }));
            const emptyState = list.querySelector('.text-sm.text-gray-500');
            if (emptyState && list.children.length > 1) {
                emptyState.remove();
            }
            if (clearField) field.value = '';
            return true;
        }

        function switchExecutionTab(tabName) {
            const tabs = ['detail', 'info'];
            tabs.forEach(function (tab) {
                const tabButton = document.getElementById('tab-execution-' + tab);
                const tabContent = document.getElementById('tab-content-execution-' + tab);
                if (!tabButton || !tabContent) return;
                const active = tab === tabName;
                tabButton.classList.toggle('border-bevap-green', active);
                tabButton.classList.toggle('text-bevap-green', active);
                tabButton.classList.toggle('bg-green-50', active);
                tabButton.classList.toggle('border-transparent', !active);
                tabButton.classList.toggle('text-gray-500', !active);
                tabButton.classList.toggle('hover:text-gray-700', !active);
                tabContent.classList.toggle('hidden', !active);
            });
        }

        function updateExecutionTabsArrows() {
            const scroller = document.getElementById('execution-panel-tabs-scroll');
            const leftArrow = document.getElementById('execution-panel-tabs-left-arrow');
            const rightArrow = document.getElementById('execution-panel-tabs-right-arrow');
            if (!scroller || !leftArrow || !rightArrow) return;

            const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            const hasOverflow = maxScroll > 2;
            const atStart = scroller.scrollLeft <= 2;
            const atEnd = scroller.scrollLeft >= maxScroll - 2;

            leftArrow.classList.toggle('opacity-0', !hasOverflow || atStart);
            leftArrow.classList.toggle('pointer-events-none', !hasOverflow || atStart);
            rightArrow.classList.toggle('opacity-0', !hasOverflow || atEnd);
            rightArrow.classList.toggle('pointer-events-none', !hasOverflow || atEnd);
        }

        function scrollExecutionTabs(direction) {
            const scroller = document.getElementById('execution-panel-tabs-scroll');
            if (!scroller) return;
            const target = direction === 'right'
                ? (scroller.scrollWidth - scroller.clientWidth)
                : 0;
            scroller.scrollTo({ left: target, behavior: 'smooth' });
            window.setTimeout(updateExecutionTabsArrows, 360);
        }

        document.getElementById('tab-execution-detail')?.addEventListener('click', function () {
            switchExecutionTab('detail');
        });
        document.getElementById('tab-execution-info')?.addEventListener('click', function () {
            switchExecutionTab('info');
        });
        document.getElementById('execution-panel-tabs-left-arrow')?.addEventListener('click', function () {
            scrollExecutionTabs('left');
        });
        document.getElementById('execution-panel-tabs-right-arrow')?.addEventListener('click', function () {
            scrollExecutionTabs('right');
        });
        document.getElementById('execution-panel-tabs-scroll')?.addEventListener('scroll', updateExecutionTabsArrows);
        window.setTimeout(updateExecutionTabsArrows, 0);
        switchExecutionTab('detail');

        const addCommentButton = document.querySelector('[data-action="add-execution-comment"]');
        if (addCommentButton) {
            addCommentButton.addEventListener('click', function () {
                const added = appendExecutionCommentFromField(true);
                if (added) {
                    showToast('Comentário adicionado', 'O comentário foi incluído no registro da atividade.', 'success');
                }
            });
        }

        function validateExecution() {
            const errors = [];
            const comment = document.getElementById('execution-comment');
            appendExecutionCommentFromField(false);
            const comments = getExecutionComments();
            if (!comments.length) errors.push('Registre pelo menos um comentário da atividade.');
            setError('execution-errors', errors);
            if (comment) comment.value = '';
            return { valid: !errors.length, comment: comments[comments.length - 1] || null, comments: comments };
        }

        const sendButton = document.querySelector('[data-action="send-requester"]');
        if (sendButton) {
            sendButton.addEventListener('click', function () {
                const result = validateExecution();
                if (!result.valid) return;
                openModal({
                    title: 'Enviar para o solicitante',
                    bodyHtml: '<p class="text-sm text-gray-700">Os comentários registrados nesta atividade ficarão disponíveis para aprovação do solicitante.</p>',
                    confirmLabel: 'Enviar agora',
                    onConfirm: function () {
                        closeModal();
                        navigateWithToast('Atividade enviada', 'A validação do solicitante foi iniciada.', 'success', buildStageUrl('requester', context), function () {
                            patchTask(context, {
                                currentStage: 'requester',
                                statusLabel: 'Em validação pelo solicitante',
                                lastExecutionComment: result.comment ? result.comment.note : '',
                                comments: result.comments
                            });
                        });
                    }
                });
            });
        }
    }

    function bindRequesterEvents(context) {
        const button = document.querySelector('[data-action="submit-requester-decision"]');
        if (!button) return;
        button.addEventListener('click', function () {
            const decision = document.querySelector('input[name="requester-decision"]:checked');
            const feedback = document.getElementById('requester-feedback');
            const justification = document.getElementById('requester-rejection');
            const checklistItems = Array.from(document.querySelectorAll('.requester-checklist'));
            const errors = [];
            if (!decision) errors.push('Selecione a decisao do solicitante.');
            if (!feedback || !feedback.value.trim()) errors.push('Registre o feedback do solicitante.');
            if (decision && decision.value === 'approve' && checklistItems.some(function (item) { return !item.checked; })) {
                errors.push('Marque todos os itens do checklist do solicitante para aprovar.');
            }
            if (decision && decision.value === 'reject' && (!justification || !justification.value.trim())) {
                errors.push('Informe a justificativa da reprovacao.');
            }
            if (setError('requester-errors', errors)) return;
            const approving = decision.value === 'approve';
            openModal({
                title: approving ? 'Confirmar aprovacao do solicitante' : 'Registrar reprovacao do solicitante',
                bodyHtml: '<p class="text-sm text-gray-700">' + (approving
                    ? 'A atividade sera encaminhada para a validacao tecnica da TI.'
                    : 'A atividade permanecera no prototipo com feedback de reprovacao, sem criar tela de correcao.') + '</p>',
                confirmLabel: approving ? 'Aprovar e enviar' : 'Registrar reprovacao',
                onConfirm: function () {
                    closeModal();
                    if (approving) {
                        navigateWithToast('Solicitante aprovou', 'A atividade seguiu para a validacao tecnica.', 'success', buildStageUrl('ti', context), function () {
                            patchTask(context, {
                                currentStage: 'ti',
                                requesterFeedback: feedback.value.trim(),
                                statusLabel: 'Aguardando validacao tecnica'
                            });
                        });
                    } else {
                        patchTask(context, {
                            currentStage: 'requester',
                            requesterFeedback: feedback.value.trim(),
                            requesterRejectionReason: justification.value.trim(),
                            statusLabel: 'Reprovada pelo solicitante'
                        });
                        showToast('Reprovacao registrada', 'O prototipo registra o retorno para correcao sem abrir uma nova tela.', 'warning');
                    }
                }
            });
        });
    }

    function bindTiEvents(context) {
        const button = document.querySelector('[data-action="submit-ti-decision"]');
        if (!button) return;
        button.addEventListener('click', function () {
            const status = document.getElementById('ti-status');
            const conclusion = document.getElementById('ti-conclusion');
            const justification = document.getElementById('ti-justification');
            const checklistItems = Array.from(document.querySelectorAll('.ti-checklist'));
            const errors = [];
            if (!status || !status.value) errors.push('Selecione o status tecnico.');
            if (!conclusion || !conclusion.value.trim()) errors.push('Registre a conclusao tecnica.');
            if (status && status.value === 'approved' && checklistItems.some(function (item) { return !item.checked; })) {
                errors.push('Marque todos os itens do checklist tecnico para aprovar a atividade.');
            }
            if (status && status.value !== 'approved' && (!justification || !justification.value.trim())) {
                errors.push('Informe a justificativa para aprovar com ressalvas ou reprovar.');
            }
            if (setError('ti-errors', errors)) return;
            const approved = status.value === 'approved';
            openModal({
                title: approved ? 'Confirmar aprovacao tecnica' : 'Registrar parecer tecnico',
                bodyHtml: '<p class="text-sm text-gray-700">' + (approved
                    ? 'A atividade sera considerada tecnicamente validada e pronta para encerramento do marco.'
                    : 'O prototipo exibira o parecer tecnico com ressalvas/reprovacao sem navegar para uma tela adicional.') + '</p>',
                confirmLabel: approved ? 'Aprovar tecnicamente' : 'Registrar parecer',
                onConfirm: function () {
                    closeModal();
                    patchTask(context, {
                        currentStage: 'ti',
                        technicalConclusion: conclusion.value.trim(),
                        technicalStatus: status.value,
                        technicalJustification: justification.value.trim(),
                        statusLabel: approved ? 'Validada tecnicamente' : 'Validacao tecnica com ressalvas'
                    });
                    if (approved) {
                        setUiState('success');
                        showToast('Validacao tecnica concluida', 'A atividade foi aprovada tecnicamente no prototipo.', 'success');
                    } else {
                        showToast('Parecer tecnico registrado', 'A atividade permanece no fluxo com ressalvas/reprovacao documentada.', 'warning');
                    }
                }
            });
        });
    }

    function renderPage() {
        const context = getContext();
        const root = document.getElementById('page-root');
        if (!root) return;
        if (context.stage === 'pending' || context.stage === 'execution') {
            root.innerHTML = '' +
                renderHeader(context) +
                '<main class="pt-32 pb-24">' +
                    '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
                        renderHero(context) +
                        '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">' +
                            '<div class="lg:col-span-2">' + renderStageContent(context) + '</div>' +
                            '<aside class="lg:col-span-1">' + renderSidebar(context) + '</aside>' +
                        '</div>' +
                    '</div>' +
                '</main>' +
                (context.stage === 'pending' ? renderPendingFooter(context) : renderExecutionFooter(context)) +
                '<div id="ui-loading-overlay" class="pointer-events-none fixed inset-0 z-[60] hidden bg-slate-900/40 backdrop-blur-[2px]"><div class="flex h-full items-center justify-center"><div class="rounded-2xl bg-white px-6 py-5 text-center shadow-2xl"><i class="fa-solid fa-spinner fa-spin text-2xl text-bevap-green"></i><div class="mt-3 font-semibold text-bevap-navy">Processando interacao...</div><div class="mt-1 text-sm text-gray-600">Estado de loading para demonstracao do prototipo.</div></div></div></div>';
        } else {
            root.innerHTML = '' +
                renderHeader(context) +
                '<main class="mx-auto max-w-7xl px-4 pb-10 pt-32 sm:px-6 lg:px-8">' +
                    renderHero(context) +
                    '<div class="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">' +
                        '<div>' + renderStageContent(context) + '</div>' +
                        '<aside>' + renderSidebar(context) + '</aside>' +
                    '</div>' +
                '</main>' +
                '<div id="ui-loading-overlay" class="pointer-events-none fixed inset-0 z-[60] hidden bg-slate-900/40 backdrop-blur-[2px]"><div class="flex h-full items-center justify-center"><div class="rounded-2xl bg-white px-6 py-5 text-center shadow-2xl"><i class="fa-solid fa-spinner fa-spin text-2xl text-bevap-green"></i><div class="mt-3 font-semibold text-bevap-navy">Processando interacao...</div><div class="mt-1 text-sm text-gray-600">Estado de loading para demonstracao do prototipo.</div></div></div></div>';
        }
        bindCommonEvents();
        setUiState('default');
        if (context.stage === 'pending') bindPendingEvents(context);
        if (context.stage === 'execution') bindExecutionEvents(context);
        if (context.stage === 'requester') bindRequesterEvents(context);
        if (context.stage === 'ti') bindTiEvents(context);
    }

    document.addEventListener('DOMContentLoaded', renderPage);
})();
