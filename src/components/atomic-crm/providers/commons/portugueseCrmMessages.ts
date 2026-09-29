import type { CrmMessages } from "./englishCrmMessages";

export const portugueseCrmMessages = {
  resources: {
    companies: {
      name: "Empresa |||| Empresas",
      forcedCaseName: "Empresa",
      fields: {
        name: "Nome da empresa",
        website: "Site",
        linkedin_url: "URL do LinkedIn",
        phone_number: "Telefone",
        created_at: "Criada em",
        nb_contacts: "Número de contatos",
        revenue: "Faturamento",
        sector: "Setor",
        size: "Porte",
        tax_identifier: "CNPJ",
        address: "Endereço",
        city: "Cidade",
        zipcode: "CEP",
        state_abbr: "Estado",
        country: "País",
        description: "Descrição",
        context_links: "Links de contexto",
        sales_id: "Responsável pela conta",
      },
      empty: {
        description: "Parece que sua lista de empresas está vazia.",
        title: "Nenhuma empresa encontrada",
      },
      import: {
        title: "Importar empresas",
      },
      field_categories: {
        contact: "Contato",
        additional_info: "Informações adicionais",
        address: "Endereço",
        context: "Contexto",
      },
      action: {
        create: "Criar empresa",
        edit: "Editar empresa",
        new: "Nova empresa",
        show: "Ver empresa",
      },
      added_on: "Adicionada em %{date}",
      followed_by: "Acompanhada por %{name}",
      followed_by_you: "Acompanhada por você",
      no_contacts: "Nenhum contato",
      nb_contacts: "%{smart_count} contato |||| %{smart_count} contatos",
      nb_deals: "%{smart_count} negócio |||| %{smart_count} negócios",
      sizes: {
        one_employee: "1 funcionário",
        two_to_nine_employees: "2-9 funcionários",
        ten_to_forty_nine_employees: "10-49 funcionários",
        fifty_to_two_hundred_forty_nine_employees: "50-249 funcionários",
        two_hundred_fifty_or_more_employees: "250 ou mais funcionários",
      },
      autocomplete: {
        create_error: "Ocorreu um erro ao criar a empresa",
        create_item: "Criar %{item}",
        create_label: "Comece a digitar para criar uma nova empresa",
      },
    },
    contacts: {
      name: "Contato |||| Contatos",
      forcedCaseName: "Contato",
      field_categories: {
        background_info: "Histórico",
        identity: "Identidade",
        misc: "Diversos",
        personal_info: "Informações pessoais",
        position: "Cargo",
      },
      fields: {
        first_name: "Nome",
        last_name: "Sobrenome",
        last_seen: "Visto por último",
        title: "Cargo",
        company_id: "Empresa",
        email_jsonb: "Endereços de e-mail",
        email: "E-mail",
        phone_jsonb: "Telefones",
        phone_number: "Telefone",
        linkedin_url: "URL do LinkedIn",
        background: "Histórico (bio, como se conheceram, etc.)",
        has_newsletter: "Recebe newsletter",
        sales_id: "Responsável pela conta",
      },
      action: {
        add: "Adicionar contato",
        add_first: "Adicione seu primeiro contato",
        create: "Criar contato",
        edit: "Editar contato",
        export_vcard: "Exportar para vCard",
        new: "Novo contato",
        show: "Ver contato",
      },
      background: {
        last_activity_on: "Última atividade em %{date}",
        added_on: "Adicionado em %{date}",
        followed_by: "Acompanhado por %{name}",
        followed_by_you: "Acompanhado por você",
        status_none: "Nenhum",
      },
      position_at: "%{title} na",
      position_at_company: "%{title} na %{company}",
      empty: {
        description: "Parece que sua lista de contatos está vazia.",
        title: "Nenhum contato encontrado",
      },
      import: {
        title: "Importar contatos",
      },
      inputs: {
        genders: {
          male: "Ele/Dele",
          female: "Ela/Dela",
          nonbinary: "Elu/Delu",
        },
        personal_info_types: {
          work: "Trabalho",
          home: "Casa",
          other: "Outro",
        },
      },
      list: {
        error_loading: "Erro ao carregar os contatos",
      },
      bulk_tag: {
        action: "Etiquetar",
        back: "Voltar às etiquetas",
        create_description:
          "Crie uma nova etiqueta e aplique-a aos contatos selecionados.",
        description:
          "Escolha uma etiqueta existente ou crie uma nova para os contatos selecionados.",
        empty:
          "Nenhuma etiqueta ainda. Crie uma para etiquetar os contatos selecionados.",
        error: "Falha ao adicionar a etiqueta aos contatos",
        noop: "Os contatos selecionados já possuem esta etiqueta",
        success:
          "Etiqueta adicionada a %{smart_count} contato |||| Etiqueta adicionada a %{smart_count} contatos",
        title: "Adicionar etiqueta aos contatos",
      },
      merge: {
        action: "Mesclar com outro contato",
        confirm: "Mesclar contatos",
        current_contact: "Contato atual (será excluído)",
        description: "Mesclar este contato com outro.",
        error: "Falha ao mesclar os contatos",
        merging: "Mesclando...",
        no_additional_data: "Nenhum dado adicional para mesclar",
        select_target: "Selecione um contato para mesclar",
        success: "Contatos mesclados com sucesso",
        target_contact: "Contato de destino (será mantido)",
        title: "Mesclar contato",
        warning_description:
          "Todos os dados serão transferidos para o segundo contato. Esta ação não pode ser desfeita.",
        warning_title: "Atenção: operação destrutiva",
        what_will_be_merged: "O que será mesclado:",
      },
      filters: {
        before_last_month: "Antes do mês passado",
        before_this_month: "Antes deste mês",
        before_this_week: "Antes desta semana",
        managed_by_me: "Gerenciados por mim",
        search: "Buscar nome, empresa...",
        this_week: "Esta semana",
        today: "Hoje",
        tags: "Etiquetas",
        tasks: "Tarefas",
      },
      hot: {
        empty_change_status:
          'Altere o status de um contato adicionando uma nota a ele e clicando em "mostrar opções".',
        empty_hint: 'Contatos com status "quente" aparecerão aqui.',
        title: "Contatos quentes",
      },
    },
    deals: {
      name: "Negócio |||| Negócios",
      fields: {
        name: "Nome",
        description: "Descrição",
        company_id: "Empresa",
        contact_ids: "Contatos",
        category: "Categoria",
        amount: "Orçamento",
        expected_closing_date: "Data prevista de fechamento",
        stage: "Etapa",
      },
      action: {
        back_to_deal: "Voltar ao negócio",
        create: "Criar negócio",
        new: "Novo negócio",
      },
      field_categories: {
        misc: "Diversos",
      },
      filters: {
        only_mine: "Apenas negócios que eu gerencio",
      },
      archived: {
        action: "Arquivar",
        error: "Erro: negócio não arquivado",
        list_title: "Negócios arquivados",
        success: "Negócio arquivado",
        title: "Negócio arquivado",
        view: "Ver negócios arquivados",
      },
      inputs: {
        linked_to: "Vinculado a",
      },
      unarchived: {
        action: "Devolver ao quadro",
        error: "Erro: negócio não desarquivado",
        success: "Negócio desarquivado",
      },
      updated: "Negócio atualizado",
      empty: {
        before_create: "antes de criar um negócio.",
        description: "Parece que sua lista de negócios está vazia.",
        title: "Nenhum negócio encontrado",
      },
      import: {
        title: "Importar negócios",
      },
      invalid_date: "Data inválida",
    },
    notes: {
      name: "Nota |||| Notas",
      forcedCaseName: "Nota",
      fields: {
        status: "Status",
        date: "Data",
        attachments: "Anexos",
        contact_id: "Contato",
        deal_id: "Negócio",
      },
      action: {
        add: "Adicionar nota",
        add_first: "Adicione sua primeira nota",
        delete: "Excluir nota",
        edit: "Editar nota",
        update: "Atualizar nota",
        add_this: "Adicionar esta nota",
      },
      sheet: {
        create: "Criar nota",
        create_for: "Criar nota para %{name}",
        edit: "Editar nota",
        edit_for: "Editar nota de %{name}",
      },
      deleted: "Nota excluída",
      empty: "Nenhuma nota ainda",
      author_added: "%{name} adicionou uma nota",
      you_added: "Você adicionou uma nota",
      me: "Eu",
      list: {
        error_loading: "Erro ao carregar as notas",
      },
      note_for_contact: "Nota para %{name}",
      stepper: {
        hint: "Acesse a página de um contato e adicione uma nota",
      },
      added: "Nota adicionada",
      inputs: {
        add_note: "Adicionar uma nota",
        options_hint: "(anexar arquivos ou alterar detalhes)",
        show_options: "Mostrar opções",
      },
      actions: {
        attach_document: "Anexar documento",
      },
      validation: {
        note_or_attachment_required: "É necessário uma nota ou um anexo",
      },
    },
    sales: {
      name: "Usuário |||| Usuários",
      fields: {
        first_name: "Nome",
        last_name: "Sobrenome",
        email: "E-mail",
        secondary_email: "E-mail secundário",
        secondary_emails: "E-mails secundários",
        administrator: "Administrador",
        disabled: "Desativado",
      },
      create: {
        error: "Ocorreu um erro ao criar o usuário.",
        success:
          "Usuário criado. Em breve ele receberá um e-mail para definir a senha.",
        title: "Criar um novo usuário",
      },
      edit: {
        error: "Ocorreu um erro. Tente novamente.",
        record_not_found: "Registro não encontrado",
        success: "Usuário atualizado com sucesso",
        title: "Editar %{name}",
      },
      action: {
        new: "Novo usuário",
      },
    },
    tasks: {
      name: "Tarefa |||| Tarefas",
      forcedCaseName: "Tarefa",
      fields: {
        text: "Descrição",
        due_date: "Data de vencimento",
        type: "Tipo",
        contact_id: "Contato",
        due_short: "vence",
      },
      action: {
        add: "Adicionar tarefa",
        create: "Criar tarefa",
        edit: "Editar tarefa",
      },
      actions: {
        postpone_next_week: "Adiar para a próxima semana",
        postpone_tomorrow: "Adiar para amanhã",
        title: "ações da tarefa",
      },
      added: "Tarefa adicionada",
      deleted: "Tarefa excluída com sucesso",
      dialog: {
        create: "Criar tarefa",
        create_for: "Criar tarefa para %{name}",
      },
      sheet: {
        edit: "Editar tarefa",
        edit_for: "Editar tarefa de %{name}",
      },
      empty: "Nenhuma tarefa ainda",
      empty_list_hint:
        "As tarefas adicionadas aos seus contatos aparecerão aqui.",
      filters: {
        later: "Mais tarde",
        overdue: "Atrasadas",
        this_week: "Esta semana",
        today: "Hoje",
        tomorrow: "Amanhã",
        with_pending: "Com tarefas pendentes",
      },
      regarding_contact: "(Ref.: %{name})",
      updated: "Tarefa atualizada",
    },
    tags: {
      name: "Etiqueta |||| Etiquetas",
      action: {
        add: "Adicionar etiqueta",
        create: "Criar nova etiqueta",
      },
      dialog: {
        color: "Cor",
        create_title: "Criar uma nova etiqueta",
        edit_title: "Editar etiqueta",
        name_label: "Nome da etiqueta",
        name_placeholder: "Digite o nome da etiqueta",
      },
    },
  },
  crm: {
    ai: {
      title: "Assistente IA",
      nav: "Assistente",
      new_conversation: "Nova conversa",
      conversations: "Conversas",
      no_conversations: "Nenhuma conversa ainda",
      delete_conversation: "Excluir conversa",
      delete_confirm: "Excluir esta conversa?",
      placeholder:
        "Pergunte sobre seus contatos, empresas, negócios ou tarefas…",
      send: "Enviar",
      thinking: "Pensando…",
      empty_title: "Como posso ajudar?",
      empty_hint:
        "Faça uma pergunta sobre os dados do seu CRM ou peça para criar ou atualizar registros. Eu sempre peço confirmação antes de alterar qualquer coisa.",
      go_to_settings: "Abrir configurações",
      pending: {
        title: "Confirmar esta alteração",
        no_summary: "Alteração proposta pelo assistente",
        show_sql: "Ver SQL",
        confirm: "Aplicar",
        cancel: "Cancelar",
      },
      errors: {
        not_configured:
          "O assistente de IA ainda não foi configurado. Peça a um administrador para adicionar uma chave de API da OpenAI nas configurações.",
        not_configured_admin:
          "Adicione uma chave de API da OpenAI nas configurações para ativar o assistente de IA.",
        invalid_api_key:
          "A chave de API da OpenAI foi recusada. Verifique-a nas configurações.",
        provider_error: "O provedor de IA retornou um erro. Tente novamente.",
        unavailable:
          "O assistente de IA precisa do backend Supabase e não está disponível no modo demo.",
        generic: "Algo deu errado com o assistente de IA.",
      },
      settings: {
        title: "Assistente de IA",
        api_key: "Chave de API da OpenAI",
        api_key_configured:
          "Chave configurada (%{hint}), digite outra para substituir",
        api_key_help:
          "Guardada apenas no servidor. Quem usa o assistente nunca a vê.",
        model: "Modelo",
        save: "Salvar configurações de IA",
        saved: "Configurações de IA salvas",
        save_error: "Falha ao salvar as configurações de IA",
        remove_key: "Remover chave",
      },
    },
    configuration: {
      companySectors: {
        "communication-services": "Serviços de comunicação",
        "consumer-discretionary": "Consumo discricionário",
        "consumer-staples": "Bens de consumo básico",
        energy: "Energia",
        financials: "Financeiro",
        "health-care": "Saúde",
        industrials: "Indústria",
        "information-technology": "Tecnologia da informação",
        materials: "Materiais",
        "real-estate": "Imobiliário",
        utilities: "Serviços públicos",
      },
      dealStages: {
        opportunity: "Oportunidade",
        "proposal-sent": "Proposta enviada",
        "in-negociation": "Em negociação",
        won: "Ganho",
        lost: "Perdido",
        delayed: "Adiado",
      },
      dealCategories: {
        other: "Outro",
        copywriting: "Redação publicitária",
        "print-project": "Projeto gráfico",
        "ui-design": "Design de interface",
        "website-design": "Criação de sites",
      },
      noteStatuses: {
        cold: "Frio",
        warm: "Morno",
        hot: "Quente",
        "in-contract": "Em contrato",
      },
      taskTypes: {
        none: "Nenhum",
        email: "E-mail",
        demo: "Demonstração",
        lunch: "Almoço",
        meeting: "Reunião",
        "follow-up": "Acompanhamento",
        "thank-you": "Agradecimento",
        ship: "Entrega",
        call: "Ligação",
      },
    },
    action: {
      reset_password: "Redefinir senha",
    },
    auth: {
      first_name: "Nome",
      last_name: "Sobrenome",
      confirm_password: "Confirmar senha",
      confirmation_required:
        "Clique no link que acabamos de enviar por e-mail para confirmar sua conta.",
      recovery_email_sent:
        "Se você for um usuário cadastrado, receberá em breve um e-mail de recuperação de senha.",
      sign_in_failed: "Falha ao entrar.",
      sign_in_google_workspace: "Entrar com o Google Workspace",
      signup: {
        create_account: "Criar conta",
        create_first_user:
          "Crie a primeira conta de usuário para concluir a configuração.",
        creating: "Criando...",
        initial_user_created: "Usuário inicial criado com sucesso",
      },
      welcome_title: "Bem-vindo ao Atomic CRM",
    },
    common: {
      account_manager: "Responsável pela conta",
      activity: "Atividade",
      added: "adicionou",
      details: "Detalhes",
      last_activity_with_date: "última atividade %{date}",
      load_more: "Carregar mais",
      misc: "Diversos",
      past: "Anteriores",
      read_more: "Ler mais",
      retry: "Tentar novamente",
      show_less: "Mostrar menos",
      copied: "Copiado!",
      copy: "Copiar",
      loading: "Carregando...",
      me: "Eu",
      task_count: "%{smart_count} tarefa |||| %{smart_count} tarefas",
    },
    changelog: {
      title: "Histórico de alterações",
    },
    activity: {
      added_company: "%{name} adicionou a empresa",
      you_added_company: "Você adicionou a empresa",
      added_contact: "%{name} adicionou",
      you_added_contact: "Você adicionou",
      added_note: "%{name} adicionou uma nota sobre",
      you_added_note: "Você adicionou uma nota sobre",
      added_note_about_deal: "%{name} adicionou uma nota sobre o negócio",
      you_added_note_about_deal: "Você adicionou uma nota sobre o negócio",
      added_deal: "%{name} adicionou o negócio",
      you_added_deal: "Você adicionou o negócio",
      at_company: "na",
      to: "para",
      load_more: "Carregar mais atividades",
    },
    dashboard: {
      deals_chart: "Receita prevista de negócios",
      deals_pipeline: "Funil de negócios",
      latest_activity: "Atividades recentes",
      latest_activity_error: "Erro ao carregar as atividades recentes",
      latest_notes: "Minhas notas recentes",
      latest_notes_added_ago: "adicionada %{timeAgo}",
      stepper: {
        install: "Instalar o Atomic CRM",
        progress: "%{step}/3 concluídos",
        whats_next: "Próximos passos",
      },
      upcoming_tasks: "Próximas tarefas",
    },
    data_import: {
      button: "Importar CSV",
      complete:
        "Importação concluída. %{importCount} registros importados, com %{errorCount} erros",
      csv_file: "Arquivo CSV",
      error:
        "Falha ao importar este arquivo. Verifique se você enviou um arquivo CSV válido.",
      in_progress: "Importação em andamento…",
      progress:
        "%{importCount} / %{rowCount} registros importados, com %{errorCount} erros.",
      remaining_time: "Tempo restante estimado:",
      resource: "Recurso",
      sample_download: "Baixar exemplo de CSV",
      sample_hint:
        "Aqui está um arquivo CSV de exemplo que você pode usar como modelo",
      start: "Iniciar importação",
      stop: "Parar importação",
      stopped:
        "Importação interrompida. %{importCount} registros importados, com %{errorCount} erros",
      title: "Importar dados",
    },
    header: {
      import_data: "Importar de JSON",
    },
    image_editor: {
      change: "Alterar",
      drop_hint: "Solte um arquivo para enviar ou clique para selecioná-lo.",
      editable_content: "Conteúdo editável",
      title: "Enviar e redimensionar imagem",
      update_image: "Atualizar imagem",
    },
    import: {
      action: {
        download_error_report: "Baixar o relatório de erros",
        import: "Importar",
        import_another: "Importar outro arquivo",
      },
      error: {
        unable: "Não foi possível importar este arquivo.",
      },
      idle: {
        description_1:
          "Você pode importar usuários, empresas, contatos, notas e tarefas.",
        description_2:
          "Os dados devem estar em um arquivo JSON no formato do exemplo a seguir:",
      },
      status: {
        all_success: "Todos os registros foram importados com sucesso.",
        complete: "Importação concluída.",
        failed: "Falharam",
        imported: "Importados",
        in_progress: "Importação em andamento, não saia desta página.",
        some_failed: "Alguns registros não foram importados.",
        table_caption: "Status da importação",
      },
      title: "Importar de JSON",
    },
    settings: {
      about: "Sobre",
      companies: {
        sectors: "Setores",
      },
      dark_mode_logo: "Logo do modo escuro",
      deals: {
        categories: "Categorias",
        currency: "Moeda",
        pipeline_help:
          "Selecione quais etapas de negócio devem contar como negócios em andamento no funil.",
        pipeline_statuses: "Status do funil",
        stages: "Etapas",
      },
      light_mode_logo: "Logo do modo claro",
      notes: {
        statuses: "Status",
      },
      reset_defaults: "Restaurar padrões",
      save_error: "Falha ao salvar a configuração",
      saved: "Configuração salva com sucesso",
      saving: "Salvando...",
      tasks: {
        types: "Tipos",
      },
      preferences: "Preferências",
      title: "Configurações",
      app_title: "Título do app",
      sections: {
        branding: "Identidade visual",
      },
      validation: {
        duplicate: "%{display_name} duplicadas: %{items}",
        in_use:
          "Não é possível remover %{display_name} ainda usadas por negócios: %{items}",
        validating: "Validando…",
        entities: {
          categories: "categorias",
          stages: "etapas",
        },
      },
    },
    theme: {
      dark: "Escuro",
      label: "Tema",
      light: "Claro",
      system: "Sistema",
    },
    language: "Idioma",
    navigation: {
      label: "Navegação do CRM",
    },
    profile: {
      add_secondary_email: "Adicionar um e-mail",
      email_taken: "%{email} já está em uso por outro usuário",
      no_secondary_emails: "Nenhum",
      secondary_email_invalid: "%{email} não é um endereço de e-mail válido",
      secondary_email_is_primary: "%{email} já é o seu endereço principal",
      secondary_email_taken: "%{email} já está em uso por outro usuário",
      too_many_secondary_emails:
        "Você não pode adicionar mais de 10 endereços de e-mail secundários",
      secondary_emails_help:
        "Outros endereços dos quais você envia e-mails. Deixe um vazio para removê-lo.",
      inbound: {
        description:
          "Você pode começar a enviar e-mails para o endereço de recebimento do seu servidor, por exemplo adicionando-o ao campo %{field}. O Atomic CRM processará os e-mails e adicionará notas aos contatos correspondentes.",
        title: "E-mail de entrada",
      },
      mcp: {
        title: "Servidor MCP",
        description:
          "Use esta URL para conectar seu assistente de IA aos dados do CRM via Model Context Protocol (MCP).",
      },
      password: {
        change: "Alterar senha",
      },
      password_reset_sent:
        "Um e-mail de redefinição de senha foi enviado para o seu endereço",
      record_not_found: "Registro não encontrado",
      title: "Perfil",
      updated: "Seu perfil foi atualizado",
      update_error: "Ocorreu um erro. Tente novamente",
    },
    validation: {
      invalid_url: "Deve ser uma URL válida",
      invalid_linkedin_url: "A URL deve ser do linkedin.com",
    },
  },
} satisfies CrmMessages;
