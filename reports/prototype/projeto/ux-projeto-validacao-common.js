(function () {
    var phasesData = [
        {
            name: 'Descoberta e Análise',
            responsible: 'Ana Costa',
            effort: 72,
            duration: 10,
            dependencies: [
                'Kickoff inicial validado com todas as áreas',
                'Aprovação formal do escopo funcional inicial'
            ],
            notes: 'Levantamento de requisitos, consolidação documental e preparação da base funcional para a execução.',
            tasks: [
                { name: 'Mapear sistemas impactados', responsible: 'Carlos Silva', effort: 12, duration: 2, dependency: 'Kickoff inicial validado com todas as areas' },
                { name: 'Entrevistar stakeholders', responsible: 'Ana Costa', effort: 16, duration: 2, dependency: 'Agenda executiva' },
                { name: 'Definir escopo funcional', responsible: 'PMO Corporativo', effort: 20, duration: 3, dependency: 'Inputs do negócio' },
                { name: 'Consolidar documentação inicial', responsible: 'Mariana Lima', effort: 24, duration: 3, dependency: 'Validação do escopo' }
            ]
        },
        {
            name: 'Implementação SSO',
            responsible: 'TechPartners',
            effort: 160,
            duration: 20,
            dependencies: [
                'Conclusão da fase de Descoberta e Análise',
                'Liberação do ambiente de homologação pela infraestrutura'
            ],
            notes: 'Construção técnica da integração, federação de identidade e preparação dos componentes de autenticação.',
            tasks: [
                { name: 'Provisionar ambiente de homologacao', responsible: 'Equipe Infraestrutura', effort: 24, duration: 3, dependency: 'Acesso cloud' },
                { name: 'Configurar federação com AD', responsible: 'TechPartners', effort: 32, duration: 4, dependency: 'Credenciais de diretório' },
                { name: 'Implementar fluxo OAuth2/SAML', responsible: 'Rafael Souza', effort: 40, duration: 5, dependency: 'Definição técnica' },
                { name: 'Aplicar políticas de segurança', responsible: 'Segurança da Informação', effort: 16, duration: 2, dependency: 'Baseline de segurança' },
                { name: 'Executar testes integrados', responsible: 'Mariana Lima', effort: 24, duration: 3, dependency: 'Build estável' }
            ]
        },
        {
            name: 'Validação e Go-Live',
            responsible: 'PMO Corporativo',
            effort: 100,
            duration: 13,
            dependencies: [
                'Conclusão da implementação SSO',
                'Evidências técnicas aprovadas pela Segurança da Informação'
            ],
            notes: 'Validação final com negócio, estabilização inicial e preparação da entrada assistida em produção.',
            tasks: [
                { name: 'Planejar roteiro de testes UAT', responsible: 'Ana Costa', effort: 16, duration: 2, dependency: 'Ambiente homologado' },
                { name: 'Executar bateria de testes UAT', responsible: 'Carlos Silva', effort: 24, duration: 3, dependency: 'Roteiro aprovado' },
                { name: 'Corrigir pendências críticas', responsible: 'TechPartners', effort: 24, duration: 3, dependency: 'Resultado UAT' },
                { name: 'Aprovar checklist de produção', responsible: 'Segurança da Informação', effort: 8, duration: 1, dependency: 'Evidências completas' },
                { name: 'Realizar go-live assistido', responsible: 'Equipe Infraestrutura', effort: 16, duration: 2, dependency: 'Janela de mudança' },
                { name: 'Monitorar estabilização inicial', responsible: 'Rafael Souza', effort: 12, duration: 2, dependency: 'Go-live concluído' }
            ]
        }
    ];

    var milestonesData = [
        {
            name: 'Concluir descoberta e baseline técnico',
            period: '05/02/2026 até 10/02/2026',
            status: 'concluido',
            owner: 'Ana Costa',
            criteria: [
                'Escopo funcional validado com negócio e TI.',
                'Matriz de sistemas impactados aprovada.'
            ],
            tasks: [
                { phaseName: 'Descoberta e Análise', taskName: 'Mapear sistemas impactados', responsible: 'Carlos Silva', date: '27/01/2026', status: 'concluido' },
                { phaseName: 'Implementação SSO', taskName: 'Provisionar ambiente de homologação', responsible: 'Equipe Infraestrutura', date: '31/01/2026', status: 'concluido' },
                { phaseName: 'Validação e Go-Live', taskName: 'Planejar roteiro de testes UAT', responsible: 'Ana Costa', date: '03/02/2026', status: 'concluido' }
            ]
        },
        {
            name: 'Entrega da implementação SSO em homologação',
            period: '10/03/2026 até 18/03/2026',
            status: 'em_andamento',
            owner: 'TechPartners',
            criteria: [
                'Federação com AD funcionando para usuários piloto.',
                'Políticas de segurança aplicadas e auditadas.'
            ],
            tasks: [
                { phaseName: 'Implementação SSO', taskName: 'Configurar federação com AD', responsible: 'TechPartners', date: '12/02/2026', status: 'em_execucao' },
                { phaseName: 'Descoberta e Análise', taskName: 'Definir escopo funcional', responsible: 'Ana Costa', date: '15/02/2026', status: 'concluido' },
                { phaseName: 'Implementação SSO', taskName: 'Aplicar políticas de segurança', responsible: 'Segurança da Informação', date: '20/02/2026', status: 'validacao_ti' },
                { phaseName: 'Validação e Go-Live', taskName: 'Executar bateria de testes UAT', responsible: 'Carlos Silva', date: '22/02/2026', status: 'validacao_solicitante' }
            ]
        },
        {
            name: 'Go-live e estabilização inicial',
            period: '14/03/2026 até 20/03/2026',
            status: 'planejado',
            owner: 'PMO Corporativo',
            criteria: [
                'UAT concluído sem pendências críticas abertas.',
                'Checklist de produção aprovado pelas áreas responsáveis.'
            ],
            tasks: [
                { phaseName: 'Descoberta e Análise', taskName: 'Consolidar documentação inicial', responsible: 'Rafael Souza', date: '02/03/2026', status: 'concluido' },
                { phaseName: 'Implementação SSO', taskName: 'Implementar fluxo OAuth2/SAML', responsible: 'TechPartners', date: '08/03/2026', status: 'aguardando_execucao' },
                { phaseName: 'Validação e Go-Live', taskName: 'Monitorar estabilização inicial', responsible: 'Rafael Souza', date: '14/03/2026', status: 'aguardando_execucao' },
                { phaseName: 'Validação e Go-Live', taskName: 'Aprovar checklist de produção', responsible: 'Segurança da Informação', date: '12/03/2026', status: 'aguardando_execucao' }
            ]
        }
    ];

    var risksData = [
        {
            title: 'Integração SSO com legado',
            severity: 'Alto',
            probability: 'Alta',
            impact: 'Alto',
            mitigation: 'Executar validação antecipada com os sistemas legados prioritários e reservar janela técnica para ajustes de compatibilidade.',
            fallback: 'Realizar rollout gradual por sistema, priorizando os módulos compatíveis e postergando integrações com maior risco.',
            owner: 'TechPartners'
        },
        {
            title: 'Disponibilidade da equipe-chave',
            severity: 'Médio',
            probability: 'Média',
            impact: 'Médio',
            mitigation: 'Definir backup operacional para as atividades críticas e alinhar capacidade semanal com os gestores envolvidos.',
            fallback: 'Replanejar entregas intermediarias e redistribuir atividades entre infraestrutura, PMO e fornecedor.',
            owner: 'Ana Costa'
        },
        {
            title: 'Aprovação de segurança para produção',
            severity: 'Alto',
            probability: 'Média',
            impact: 'Alto',
            mitigation: 'Antecipar evidências técnicas e checkpoints com Segurança da Informação antes do marco de go-live.',
            fallback: 'Executar entrada assistida em ondas, mantendo os sistemas críticos na autenticação atual até aprovação completa.',
            owner: 'Segurança da Informação'
        }
    ];

    var raciData = [
        {
            milestone: 'Concluir descoberta e baseline técnico',
            responsible: 'Ana Costa',
            approver: 'Diretoria TI',
            consulted: 'João Vieira, PMO Corporativo',
            informed: 'Segurança da Informação, Gestores das áreas impactadas'
        },
        {
            milestone: 'Entrega da implementacao SSO em homologacao',
            responsible: 'TechPartners',
            approver: 'Ana Costa',
            consulted: 'Equipe Infraestrutura, Segurança da Informação',
            informed: 'João Vieira, Diretoria TI'
        },
        {
            milestone: 'Go-live e estabilizacao inicial',
            responsible: 'PMO Corporativo',
            approver: 'PMO Corporativo',
            consulted: 'Equipe Infraestrutura, TechPartners, Segurança da Informação',
            informed: 'Diretoria TI, João Vieira, Gestores das áreas envolvidas'
        }
    ];

    var communicationPlanData = [
        { audience: 'Diretoria TI', channel: 'Comitê', frequency: 'Semanal' },
        { audience: 'João Vieira e solicitante', channel: 'Reunião', frequency: 'Semanal' },
        { audience: 'Segurança da Informação', channel: 'Teams', frequency: 'Por marco' },
        { audience: 'Gestores das áreas impactadas', channel: 'E-mail', frequency: 'Conforme go-live' }
    ];

    var collapsedPhases = {};
    var collapsedMilestones = {};

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getStatusMeta(status) {
        var map = {
            concluido: { label: 'Concluído', badge: 'border-green-200 bg-green-50 text-green-700', icon: 'fa-solid fa-circle-check text-green-600' },
            em_andamento: { label: 'Em andamento', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700', icon: 'fa-solid fa-hourglass-half text-yellow-600' },
            planejado: { label: 'Planejado', badge: 'border-gray-200 bg-gray-50 text-gray-700', icon: 'fa-regular fa-circle text-gray-500' }
        };
        return map[status] || map.planejado;
    }

    function getTaskStatusMeta(status) {
        var map = {
            aguardando_execucao: { label: 'Aguardando Execução', badge: 'border-gray-200 bg-gray-50 text-gray-700', icon: 'fa-regular fa-clock text-gray-500' },
            em_execucao: { label: 'Em Execução', badge: 'border-blue-200 bg-blue-50 text-blue-700', icon: 'fa-solid fa-play text-blue-600' },
            validacao_solicitante: { label: 'Validação do Solicitante', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700', icon: 'fa-solid fa-user-check text-yellow-600' },
            validacao_ti: { label: 'Validação do TI', badge: 'border-indigo-200 bg-indigo-50 text-indigo-700', icon: 'fa-solid fa-shield-halved text-indigo-600' },
            concluido: { label: 'Concluído', badge: 'border-green-200 bg-green-50 text-green-700', icon: 'fa-solid fa-circle-check text-green-600' }
        };
        return map[status] || map.aguardando_execucao;
    }

    function renderPhases() {
        var container = document.getElementById('execution-phases-list');
        if (!container) return;
        container.innerHTML = phasesData.map(function (phase, index) {
            var isCollapsed = collapsedPhases[index] === true;
            return '' +
                '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">' +
                    '<div class="flex items-start gap-3">' +
                        '<span class="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0"><i class="fa-solid fa-layer-group text-base"></i></span>' +
                        '<div class="min-w-0 flex-1 pt-0.5">' +
                            '<h3 class="text-base font-montserrat font-semibold text-bevap-navy">FASE: ' + escapeHtml(phase.name) + '</h3>' +
                            '<p class="mt-1 text-sm leading-6 text-gray-600">' + escapeHtml(phase.notes) + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap items-center justify-between gap-3">' +
                        '<div class="flex flex-wrap gap-2 text-[13px]">' +
                            '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1" style="color: #dbeafe;"></i>Responsável: ' + escapeHtml(phase.responsible) + '</span>' +
                            '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Duração: ' + phase.duration + ' dias</span>' +
                            '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>Esforço Total: ' + phase.effort + 'h</span>' +
                        '</div>' +
                        '<button type="button" onclick="togglePhaseCollapse(' + index + ')" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><i class="fa-solid ' + (isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + ' mr-2 text-gray-400"></i>' + (isCollapsed ? 'Expandir' : 'Recolher') + '</button>' +
                    '</div>' +
                    '<div class="' + (isCollapsed ? 'hidden' : 'block') + '">' +
                        '<div class="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">' +
                            '<div class="flex items-center gap-3 text-sm font-semibold text-gray-900"><span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-200 text-yellow-700 shrink-0"><i class="fa-solid fa-link text-xs"></i></span><span>Dependências da Fase</span></div>' +
                            '<div class="mt-3 space-y-2 pl-12">' +
                                phase.dependencies.map(function (dependency) {
                                    return '<div class="flex items-start gap-3 text-sm text-gray-700"><span class="mt-2 inline-flex h-2.5 w-2.5 rounded-full bg-yellow-700 shrink-0"></span><span class="font-medium text-gray-700">' + escapeHtml(dependency) + '</span></div>';
                                }).join('') +
                            '</div>' +
                        '</div>' +
                        '<div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4">' +
                            '<div class="mb-3 flex items-center justify-between gap-3"><div><h4 class="text-sm font-montserrat font-semibold text-gray-900">Tarefas da Fase</h4><p class="text-xs text-gray-500">Relação de tarefas planejadas com esforço e duração.</p></div><span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">' + phase.tasks.length + ' tarefas</span></div>' +
                            '<div class="space-y-3">' +
                                phase.tasks.map(function (task) {
                                    return '<div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-sm font-semibold text-bevap-navy">' + escapeHtml(task.name) + '</div><div class="mt-2 flex flex-wrap gap-2 text-[13px]"><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user mr-1" style="color: #dbeafe;"></i>Responsável: ' + escapeHtml(task.responsible) + '</span><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + task.effort + 'h</span><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>' + task.duration + ' dias</span></div><div class="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600"><span class="font-medium text-gray-700">Dependência:</span> ' + escapeHtml(task.dependency) + '</div></div>';
                                }).join('') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function renderMilestones() {
        var container = document.getElementById('execution-milestones-list');
        if (!container) return;
        container.innerHTML = milestonesData.map(function (milestone, index) {
            var status = getStatusMeta(milestone.status);
            var isCollapsed = collapsedMilestones[index] === true;
            return '' +
                '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="min-w-0 flex-1"><div class="flex items-center gap-3"><span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700 shrink-0"><i class="fa-solid fa-flag-checkered text-base"></i></span><div class="min-w-0 flex-1"><h3 class="text-base font-montserrat font-semibold text-bevap-navy">Marco: ' + escapeHtml(milestone.name) + '</h3></div></div></div>' +
                        '<span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ' + status.badge + '"><i class="' + status.icon + '"></i><span>' + status.label + '</span></span>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap items-center justify-between gap-3"><div class="flex flex-wrap gap-2 text-[13px]"><span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1" style="color: #dbeafe;"></i>Responsável: ' + escapeHtml(milestone.owner) + '</span><span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-alt mr-1 text-red-100"></i>' + escapeHtml(milestone.period) + '</span></div><button type="button" onclick="toggleMilestoneCollapse(' + index + ')" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><i class="fa-solid ' + (isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + ' mr-2 text-gray-400"></i>' + (isCollapsed ? 'Expandir' : 'Recolher') + '</button></div>' +
                    '<div class="' + (isCollapsed ? 'hidden' : 'block') + '">' +
                        '<div class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><div class="mb-1.5 flex items-center gap-2"><i class="fa-solid fa-check-double text-sm text-blue-700"></i><h4 class="text-sm font-montserrat font-semibold text-gray-900">Critérios de Aceite</h4></div><div class="space-y-0.5">' +
                            milestone.criteria.map(function (item) {
                                return '<div class="flex items-start gap-1 rounded-lg bg-blue-50 px-3 py-1 text-sm leading-snug text-gray-700"><i class="fa-solid fa-check mt-0.5 text-[10px] text-bevap-green"></i><span>' + escapeHtml(item) + '</span></div>';
                            }).join('') +
                        '</div></div>' +
                        '<div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4"><div class="mb-3 flex items-center justify-between gap-3"><div><h4 class="text-sm font-montserrat font-semibold text-gray-900">Tarefas do Marco</h4><p class="text-xs text-gray-500">Tarefas relacionadas no planejamento para compor esta entrega.</p></div><span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">' + milestone.tasks.length + ' tarefas</span></div><div class="space-y-3">' +
                            milestone.tasks.map(function (task) {
                                var taskStatus = getTaskStatusMeta(task.status);
                                return '<div class="rounded-xl border border-gray-200 bg-white p-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0 flex-1"><a href="../marcos/ux-marco-execucao-atividade.html" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-bevap-navy hover:text-blue-700 transition-colors"><span>' + escapeHtml(task.taskName) + '</span><i class="fa-solid fa-link text-[11px] shrink-0"></i></a><div class="mt-2 flex flex-wrap gap-2 text-[13px]"><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1 text-blue-100"></i>Responsável: ' + escapeHtml(task.responsible) + '</span><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-solid fa-layer-group mr-1 text-green-200"></i>Fase: ' + escapeHtml(task.phaseName) + '</span><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>' + escapeHtml(task.date) + '</span></div></div><span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ' + taskStatus.badge + '"><i class="' + taskStatus.icon + '"></i><span>' + taskStatus.label + '</span></span></div></div>';
                            }).join('') +
                        '</div></div>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function renderRisks() {
        var container = document.getElementById('execution-risks-list');
        if (!container) return;
        container.innerHTML = risksData.map(function (risk) {
            var accent = risk.severity === 'Alto' ? 'border-red-300 bg-white' : (risk.severity === 'Médio' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50');
            return '<div class="rounded-xl border p-5 shadow-sm ' + accent + '"><div class="flex items-start justify-between gap-3"><div class="min-w-0 flex-1"><div class="flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation text-sm ' + (risk.severity === 'Alto' ? 'text-red-600' : (risk.severity === 'Médio' ? 'text-yellow-600' : 'text-green-600')) + '"></i><h4 class="text-base font-montserrat font-semibold text-bevap-navy">' + escapeHtml(risk.title) + '</h4></div><div class="mt-2 text-sm text-gray-700">Probabilidade: ' + escapeHtml(risk.probability) + ' | Impacto: ' + escapeHtml(risk.impact) + '</div></div><span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ' + (risk.severity === 'Alto' ? 'bg-red-200 text-red-900' : (risk.severity === 'Médio' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')) + '">' + escapeHtml(risk.severity) + '</span></div><div class="mt-3 text-sm text-gray-600"><span class="font-medium text-gray-700">Responsável:</span> ' + escapeHtml(risk.owner) + '</div><div class="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700"><strong>Mitigação:</strong> ' + escapeHtml(risk.mitigation) + '</div><div class="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700"><strong>Plano B:</strong> ' + escapeHtml(risk.fallback) + '</div></div>';
        }).join('');
    }

    function renderRaci() {
        var body = document.getElementById('execution-raci-body');
        if (!body) return;
        body.innerHTML = raciData.map(function (row) {
            return '<tr><td class="px-4 py-3 align-top"><div class="font-medium text-bevap-navy">' + escapeHtml(row.milestone) + '</div></td><td class="px-4 py-3 align-top text-gray-700">' + escapeHtml(row.responsible) + '</td><td class="px-4 py-3 align-top text-gray-700">' + escapeHtml(row.approver) + '</td><td class="px-4 py-3 align-top text-gray-700">' + escapeHtml(row.consulted) + '</td><td class="px-4 py-3 align-top text-gray-700">' + escapeHtml(row.informed) + '</td></tr>';
        }).join('');
    }

    function renderCommunicationPlan() {
        var body = document.getElementById('execution-communication-body');
        if (!body) return;
        body.innerHTML = communicationPlanData.map(function (row) {
            return '<tr><td class="px-4 py-3 text-gray-700">' + escapeHtml(row.audience) + '</td><td class="px-4 py-3 text-gray-700">' + escapeHtml(row.channel) + '</td><td class="px-4 py-3 text-gray-700">' + escapeHtml(row.frequency) + '</td></tr>';
        }).join('');
    }

    var showChecklistArrowNotice = false;
    var refreshExecutionTabArrows = function () {};

    function bindTabs(onChecklistOpen, defaultTab) {
        var tabs = Array.from(document.querySelectorAll('[id^="tab-execution-"]'))
            .map(function (button) {
                return button.id.replace('tab-execution-', '');
            });
        var scroller = document.getElementById('execution-tabs-scroll');
        var leftArrow = document.getElementById('execution-tabs-left-arrow');
        var rightArrow = document.getElementById('execution-tabs-right-arrow');
        var checklistArrowNotice = document.getElementById('execution-checklist-arrow-notice');
        var scrollStep = 220;

        function updateArrows() {
            if (!scroller || !leftArrow || !rightArrow) return;
            var maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            var hasOverflow = maxScroll > 2;
            var atStart = scroller.scrollLeft <= 2;
            var atEnd = scroller.scrollLeft >= maxScroll - 2;
            leftArrow.classList.toggle('opacity-0', !hasOverflow || atStart);
            leftArrow.classList.toggle('pointer-events-none', !hasOverflow || atStart);
            rightArrow.classList.toggle('opacity-0', !hasOverflow || atEnd);
            rightArrow.classList.toggle('pointer-events-none', !hasOverflow || atEnd);
            if (checklistArrowNotice) {
                var shouldShowArrowNotice = showChecklistArrowNotice && hasOverflow && !atEnd;
                checklistArrowNotice.classList.toggle('hidden', !shouldShowArrowNotice);
                checklistArrowNotice.classList.toggle('flex', shouldShowArrowNotice);
            }
        }

        refreshExecutionTabArrows = updateArrows;

        function toggleTab(tabName) {
            tabs.forEach(function (tab) {
                var button = document.getElementById('tab-execution-' + tab);
                var content = document.getElementById('tab-content-execution-' + tab);
                if (!button || !content) return;
                var active = tab === tabName;
                button.classList.toggle('border-bevap-green', active);
                button.classList.toggle('text-bevap-green', active);
                button.classList.toggle('bg-green-50', active);
                button.classList.toggle('border-transparent', !active);
                button.classList.toggle('text-gray-500', !active);
                button.classList.toggle('hover:text-gray-700', !active);
                content.classList.toggle('hidden', !active);
            });
            if (tabName === 'checklist' && onChecklistOpen) onChecklistOpen();
        }

        tabs.forEach(function (tab) {
            document.getElementById('tab-execution-' + tab)?.addEventListener('click', function () {
                toggleTab(tab);
            });
        });
        leftArrow?.addEventListener('click', function () {
            if (!scroller) return;
            scroller.scrollBy({ left: -scrollStep, behavior: 'smooth' });
            window.setTimeout(updateArrows, 360);
        });
        rightArrow?.addEventListener('click', function () {
            if (!scroller) return;
            scroller.scrollBy({ left: scrollStep, behavior: 'smooth' });
            window.setTimeout(updateArrows, 360);
        });
        scroller?.addEventListener('scroll', updateArrows);
        window.addEventListener('resize', updateArrows);
        window.addEventListener('load', updateArrows);
        window.setTimeout(updateArrows, 0);
        window.setTimeout(updateArrows, 200);
        toggleTab(defaultTab || tabs[0] || 'phases');
    }

    function showToast(title, message, type) {
        var toast = document.getElementById('toast');
        var icon = document.getElementById('toast-icon');
        var titleElement = document.getElementById('toast-title');
        var messageElement = document.getElementById('toast-message');
        var types = {
            success: { border: 'border-emerald-500', icon: 'fa-solid fa-circle-check text-emerald-600' },
            error: { border: 'border-red-500', icon: 'fa-solid fa-circle-xmark text-red-600' },
            info: { border: 'border-blue-500', icon: 'fa-solid fa-circle-info text-blue-600' }
        };
        var selected = types[type] || types.info;
        if (!toast || !icon || !titleElement || !messageElement) return;
        toast.className = 'fixed top-24 right-4 z-[70] hidden max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected.border;
        icon.className = selected.icon + ' text-xl';
        titleElement.textContent = title;
        messageElement.textContent = message;
        toast.classList.remove('hidden');
        window.clearTimeout(window.__projectValidationToastTimeout);
        window.__projectValidationToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function closeModal(id) {
        document.getElementById(id)?.classList.add('hidden');
    }

    function openModal(id) {
        document.getElementById(id)?.classList.remove('hidden');
    }

    function bindClickActions(selector, handler) {
        document.querySelectorAll(selector).forEach(function (element) {
            element.addEventListener('click', function (event) {
                event.preventDefault();
                handler(event);
            });
        });
    }

    window.togglePhaseCollapse = function (index) {
        collapsedPhases[index] = !collapsedPhases[index];
        renderPhases();
    };

    window.toggleMilestoneCollapse = function (index) {
        collapsedMilestones[index] = !collapsedMilestones[index];
        renderMilestones();
    };

    window.initProjectValidationPage = function (config) {
        var currentParams = window.location.search || '';
        var checklistVisited = false;

        phasesData.forEach(function (_, index) {
            collapsedPhases[index] = true;
        });
        milestonesData.forEach(function (_, index) {
            collapsedMilestones[index] = true;
        });

        function updateChecklistProgress() {
            var items = document.querySelectorAll(config.checklist.itemSelector);
            var checked = document.querySelectorAll(config.checklist.itemSelector + ':checked').length;
            var percentage = items.length ? Math.round((checked / items.length) * 100) : 0;
            var hasPendingItems = items.length > 0 && checked < items.length;
            var noticeByIncomplete = !!config.checklist.noticeByIncomplete;
            document.getElementById(config.checklist.percentageId).textContent = percentage + '%';
            document.getElementById(config.checklist.progressId).style.width = percentage + '%';
            document.getElementById(config.checklist.noticeId)?.classList.toggle('hidden', noticeByIncomplete ? !hasPendingItems : checklistVisited);
            showChecklistArrowNotice = noticeByIncomplete ? hasPendingItems : !checklistVisited;
            refreshExecutionTabArrows();
        }

        function validateApprovalRequirements() {
            var agreement = document.getElementById(config.agreementId);
            var feedback = document.getElementById(config.feedbackId);
            if (config.commentRequired && (!feedback || !feedback.value.trim())) {
                showToast(config.messages.commentPendingTitle, config.messages.commentPendingMessage, 'error');
                feedback?.focus();
                return false;
            }
            if (!agreement || !agreement.checked) {
                showToast(config.messages.confirmationPendingTitle, config.messages.confirmationPendingMessage, 'error');
                document.getElementById('tab-execution-checklist')?.click();
                return false;
            }
            return true;
        }

        renderPhases();
        renderMilestones();
        renderRisks();
        renderRaci();
        renderCommunicationPlan();
        bindTabs(function () {
            checklistVisited = true;
            updateChecklistProgress();
        }, config.defaultTab);
        updateChecklistProgress();

        document.querySelectorAll(config.checklist.itemSelector).forEach(function (checkbox) {
            checkbox.addEventListener('change', updateChecklistProgress);
        });
        document.getElementById(config.agreementId)?.addEventListener('change', updateChecklistProgress);

        bindClickActions('[data-action="approve-project"]', function () {
            if (!validateApprovalRequirements()) return;
            openModal('approve-modal');
        });
        bindClickActions('[data-action="return-corrections"]', function () {
            openModal('return-modal');
        });
        bindClickActions('[data-action="stop-flow"]', function () {
            openModal('discontinue-modal');
        });
        bindClickActions('[data-action="close-approve-modal"]', function () {
            closeModal('approve-modal');
        });
        bindClickActions('[data-action="confirm-approve-modal"]', function () {
            closeModal('approve-modal');
            showToast(config.messages.approveSuccessTitle, config.messages.approveSuccessMessage, 'success');
            if (config.redirects.onApprove) {
                window.setTimeout(function () { window.location.href = config.redirects.onApprove + currentParams; }, 900);
            }
        });
        bindClickActions('[data-action="close-return-modal"]', function () {
            closeModal('return-modal');
        });
        bindClickActions('[data-action="confirm-return-modal"]', function () {
            var reason = document.getElementById('return-reason');
            if (!reason || !reason.value.trim()) {
                showToast(config.messages.returnPendingTitle, config.messages.returnPendingMessage, 'error');
                reason?.focus();
                return;
            }
            closeModal('return-modal');
            showToast(config.messages.returnSuccessTitle, config.messages.returnSuccessMessage, 'info');
            if (config.redirects.onReturn) {
                window.setTimeout(function () { window.location.href = config.redirects.onReturn + currentParams; }, 900);
            }
        });
        bindClickActions('[data-action="close-discontinue-modal"]', function () {
            closeModal('discontinue-modal');
        });
        bindClickActions('[data-action="confirm-discontinue-modal"]', function () {
            var category = document.getElementById('discontinue-category');
            var reason = document.getElementById('discontinue-reason');
            if (!category || !category.value || !reason || !reason.value.trim()) {
                showToast(config.messages.discontinuePendingTitle, config.messages.discontinuePendingMessage, 'error');
                return;
            }
            closeModal('discontinue-modal');
            showToast(config.messages.discontinueSuccessTitle, config.messages.discontinueSuccessMessage, 'error');
            if (config.redirects.onDiscontinue) {
                window.setTimeout(function () { window.location.href = config.redirects.onDiscontinue + currentParams; }, 900);
            }
        });

        ['approve-modal', 'return-modal', 'discontinue-modal'].forEach(function (modalId) {
            document.getElementById(modalId)?.addEventListener('click', function (event) {
                if (event.target && event.target.id === modalId) closeModal(modalId);
            });
        });
    };
})();
