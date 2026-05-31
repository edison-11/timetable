const STORAGE_KEY = 'appLanguage'

const dictionaries = {
  fr: {
    'Settings': 'Parametres',
    'Admin Control Center': 'Centre de controle admin',
    'Profile Settings': 'Parametres du profil',
    'Personal Details': 'Details personnels',
    'Security Settings': 'Parametres de securite',
    'Password & Access': 'Mot de passe et acces',
    'Account Settings': 'Parametres du compte',
    'Role & Workspace': 'Role et espace de travail',
    'Admin Tools': 'Outils admin',
    'System Tools': 'Outils systeme',
    'Notification Settings': 'Parametres de notification',
    'System Preferences': 'Preferences systeme',
    'Default Behavior': 'Comportement par defaut',
    'Appearance Settings': 'Apparence',
    'Theme & Density': 'Theme et densite',
    'Activity & Logs': 'Activite et journaux',
    'Logout Option': 'Option de deconnexion',
    'Language': 'Langue',
    'Time Format': 'Format horaire',
    'Default Dashboard View': 'Tableau de bord par defaut',
    'UI Density': 'Densite interface',
    'English': 'Anglais',
    'French': 'Francais',
    'Portuguese': 'Portugais',
    'Kinyarwanda': 'Kinyarwanda',
    'Light Mode': 'Mode clair',
    'Dark Mode': 'Mode sombre',
    'Comfortable': 'Confortable',
    'Compact': 'Compact',
    'Overview': 'Apercu',
    'Timetable': 'Emploi du temps',
    'Teachers': 'Enseignants',
    'Reports': 'Rapports',
    'Manage Schools': 'Gerer les ecoles',
    'Open Default Dashboard': 'Ouvrir le tableau par defaut',
    'Save Changes': 'Enregistrer',
    'All Teachers': 'Tous les enseignants',
    'Add New Teacher': 'Ajouter un enseignant',
    'Search teachers...': 'Rechercher des enseignants...',
    'All Departments': 'Tous les departements',
    'All Status': 'Tous les statuts',
    'Teacher': 'Enseignant',
    'Department': 'Departement',
    'Status': 'Statut',
    'Date Joined': 'Date entree',
    'Actions': 'Actions',
    'Details': 'Details',
    'Approve': 'Approuver',
    'Reject': 'Rejeter',
    'Edit': 'Modifier',
    'Delete': 'Supprimer',
    'No teachers found': 'Aucun enseignant trouve',
    'My Profile': 'Mon profil',
    'Statistics': 'Statistiques',
    'Total Classes': 'Total classes',
    'Students Taught': 'Etudiants enseignes',
    'Subjects': 'Matieres',
    'Pending Requests': 'Demandes en attente',
    'Edit Profile': 'Modifier le profil',
    'Change Password': 'Changer le mot de passe',
    'Download Profile': 'Telecharger le profil',
    'Active': 'Actif',
    'Pending': 'En attente',
    'Rejected': 'Rejete',
    'Approved': 'Approuve',
    'Cancel': 'Annuler',
    'Logout': 'Deconnexion'
  },
  pt: {
    'Settings': 'Configuracoes',
    'Admin Control Center': 'Centro de controle admin',
    'Profile Settings': 'Configuracoes do perfil',
    'Personal Details': 'Detalhes pessoais',
    'Security Settings': 'Configuracoes de seguranca',
    'Password & Access': 'Senha e acesso',
    'Account Settings': 'Configuracoes da conta',
    'Role & Workspace': 'Funcao e area de trabalho',
    'Admin Tools': 'Ferramentas admin',
    'System Tools': 'Ferramentas do sistema',
    'Notification Settings': 'Configuracoes de notificacao',
    'System Preferences': 'Preferencias do sistema',
    'Default Behavior': 'Comportamento padrao',
    'Appearance Settings': 'Aparencia',
    'Theme & Density': 'Tema e densidade',
    'Activity & Logs': 'Atividade e registros',
    'Logout Option': 'Opcao de sair',
    'Language': 'Idioma',
    'Time Format': 'Formato de hora',
    'Default Dashboard View': 'Painel padrao',
    'UI Density': 'Densidade da interface',
    'English': 'Ingles',
    'French': 'Frances',
    'Portuguese': 'Portugues',
    'Kinyarwanda': 'Kinyarwanda',
    'Light Mode': 'Modo claro',
    'Dark Mode': 'Modo escuro',
    'Comfortable': 'Confortavel',
    'Compact': 'Compacto',
    'Overview': 'Visao geral',
    'Timetable': 'Horario',
    'Teachers': 'Professores',
    'Reports': 'Relatorios',
    'Manage Schools': 'Gerir escolas',
    'Open Default Dashboard': 'Abrir painel padrao',
    'Save Changes': 'Salvar alteracoes',
    'All Teachers': 'Todos os professores',
    'Add New Teacher': 'Adicionar professor',
    'Search teachers...': 'Pesquisar professores...',
    'All Departments': 'Todos os departamentos',
    'All Status': 'Todos os estados',
    'Teacher': 'Professor',
    'Department': 'Departamento',
    'Status': 'Estado',
    'Date Joined': 'Data de entrada',
    'Actions': 'Acoes',
    'Details': 'Detalhes',
    'Approve': 'Aprovar',
    'Reject': 'Rejeitar',
    'Edit': 'Editar',
    'Delete': 'Excluir',
    'No teachers found': 'Nenhum professor encontrado',
    'My Profile': 'Meu perfil',
    'Statistics': 'Estatisticas',
    'Total Classes': 'Total de turmas',
    'Students Taught': 'Alunos ensinados',
    'Subjects': 'Disciplinas',
    'Pending Requests': 'Pedidos pendentes',
    'Edit Profile': 'Editar perfil',
    'Change Password': 'Alterar senha',
    'Download Profile': 'Baixar perfil',
    'Active': 'Ativo',
    'Pending': 'Pendente',
    'Rejected': 'Rejeitado',
    'Approved': 'Aprovado',
    'Cancel': 'Cancelar',
    'Logout': 'Sair'
  },
  rw: {
    'Settings': 'Igenamiterere',
    'Admin Control Center': 'Ikigo cy igenzura rya admin',
    'Profile Settings': 'Igenamiterere rya profayile',
    'Personal Details': 'Amakuru bwite',
    'Security Settings': 'Igenamiterere ry umutekano',
    'Password & Access': 'Ijambo banga n uburenganzira',
    'Account Settings': 'Igenamiterere rya konti',
    'Role & Workspace': 'Uruhare n aho ukorera',
    'Admin Tools': 'Ibikoresho bya admin',
    'System Tools': 'Ibikoresho bya sisitemu',
    'Notification Settings': 'Igenamiterere ry amatangazo',
    'System Preferences': 'Ibyifuzo bya sisitemu',
    'Default Behavior': 'Imikorere isanzwe',
    'Appearance Settings': 'Imigaragarire',
    'Theme & Density': 'Insanganyamatsiko n ubucucike',
    'Activity & Logs': 'Ibikorwa n inyandiko',
    'Logout Option': 'Gusohoka',
    'Language': 'Ururimi',
    'Time Format': 'Imiterere y isaha',
    'Default Dashboard View': 'Dashboard isanzwe',
    'UI Density': 'Ubucucike bwa UI',
    'English': 'Icyongereza',
    'French': 'Igifaransa',
    'Portuguese': 'Igiporutugali',
    'Kinyarwanda': 'Ikinyarwanda',
    'Light Mode': 'Urumuri',
    'Dark Mode': 'Umwijima',
    'Comfortable': 'Byagutse',
    'Compact': 'Byegeranye',
    'Overview': 'Incamake',
    'Timetable': 'Ingengabihe',
    'Teachers': 'Abarimu',
    'Reports': 'Raporo',
    'Manage Schools': 'Gucunga amashuri',
    'Open Default Dashboard': 'Fungura dashboard isanzwe',
    'Save Changes': 'Bika impinduka',
    'All Teachers': 'Abarimu bose',
    'Add New Teacher': 'Ongeramo mwarimu',
    'Search teachers...': 'Shaka abarimu...',
    'All Departments': 'Amashami yose',
    'All Status': 'Imiterere yose',
    'Teacher': 'Mwarimu',
    'Department': 'Ishami',
    'Status': 'Imiterere',
    'Date Joined': 'Itariki yinjiye',
    'Actions': 'Ibikorwa',
    'Details': 'Ibisobanuro',
    'Approve': 'Emeza',
    'Reject': 'Hakana',
    'Edit': 'Hindura',
    'Delete': 'Siba',
    'No teachers found': 'Nta mwarimu wabonetse',
    'My Profile': 'Profayile yanjye',
    'Statistics': 'Imibare',
    'Total Classes': 'Amasomo yose',
    'Students Taught': 'Abanyeshuri yigishije',
    'Subjects': 'Amasomo',
    'Pending Requests': 'Ibisabwa bitegereje',
    'Edit Profile': 'Hindura profayile',
    'Change Password': 'Hindura ijambo banga',
    'Download Profile': 'Kuramo profayile',
    'Active': 'Irakora',
    'Pending': 'Itegereje',
    'Rejected': 'Yanzwe',
    'Approved': 'Yemejwe',
    'Cancel': 'Hagarika',
    'Logout': 'Sohoka'
  }
}

const reverseLookup = new Map()
for (const [language, dictionary] of Object.entries(dictionaries)) {
  for (const [source, translated] of Object.entries(dictionary)) {
    reverseLookup.set(translated, source)
    reverseLookup.set(source, source)
  }
}

const getDictionary = (language) => dictionaries[language] || {}

const translateValue = (value, language) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return value
  const source = reverseLookup.get(trimmed) || trimmed
  return language === 'en' ? source : getDictionary(language)[source] || source
}

const translateTextNode = (node, language) => {
  const raw = node.nodeValue || ''
  const trimmed = raw.trim()
  if (!trimmed) return

  const source = node.__appLanguageSource || reverseLookup.get(trimmed) || trimmed
  const translated = translateValue(source, language)
  node.__appLanguageSource = source
  if (translated !== trimmed) {
    node.nodeValue = raw.replace(trimmed, translated)
  }
}

const translateAttribute = (element, attribute, language) => {
  const value = element.getAttribute(attribute)
  if (!value) return
  const sourceAttribute = `data-app-language-source-${attribute.replace(/[^a-z0-9]/gi, '-')}`
  const source = element.getAttribute(sourceAttribute) || reverseLookup.get(value.trim()) || value.trim()
  const translated = translateValue(source, language)
  element.setAttribute(sourceAttribute, source)
  if (translated !== value) {
    element.setAttribute(attribute, translated)
  }
}

export const getAppLanguage = () => localStorage.getItem(STORAGE_KEY) || 'en'

export const translate = (source, language = getAppLanguage()) => translateValue(source, language)

export const applyAppLanguage = (language = getAppLanguage(), root = document.getElementById('app')) => {
  localStorage.setItem(STORAGE_KEY, language)
  document.documentElement.lang = language
  document.documentElement.dataset.language = language

  if (!root) return

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT
      if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((node) => translateTextNode(node, language))

  root.querySelectorAll('[placeholder], [title], [aria-label]').forEach((element) => {
    translateAttribute(element, 'placeholder', language)
    translateAttribute(element, 'title', language)
    translateAttribute(element, 'aria-label', language)
  })
}

export const setAppLanguage = (language) => {
  applyAppLanguage(language)
  window.dispatchEvent(new CustomEvent('app-language-change', { detail: { language } }))
}

export const watchAppLanguage = () => {
  let scheduled = false
  const run = () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      applyAppLanguage()
    })
  }

  const observer = new MutationObserver(run)
  observer.observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true,
    characterData: true
  })
  applyAppLanguage()
  return observer
}
