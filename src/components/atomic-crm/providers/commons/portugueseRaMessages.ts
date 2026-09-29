import type { TranslationMessages } from "ra-core";

// Portuguese (Brazil) translations for ra-core and ra-supabase.
// No ra-language package exists in the dependencies for pt-BR, so they live here.
export const portugueseRaMessages = {
  ra: {
    action: {
      add_filter: "Adicionar filtro",
      add: "Adicionar",
      back: "Voltar",
      bulk_actions: "1 item selecionado |||| %{smart_count} itens selecionados",
      cancel: "Cancelar",
      clear_array_input: "Limpar a lista",
      clear_input_value: "Limpar valor",
      clone: "Duplicar",
      confirm: "Confirmar",
      create: "Criar",
      create_item: "Criar %{item}",
      delete: "Excluir",
      edit: "Editar",
      export: "Exportar",
      list: "Listar",
      refresh: "Atualizar",
      remove_filter: "Remover este filtro",
      remove_all_filters: "Remover todos os filtros",
      remove: "Remover",
      reset: "Redefinir",
      save: "Salvar",
      search: "Buscar",
      search_columns: "Buscar colunas",
      select_all: "Selecionar tudo",
      select_all_button: "Selecionar tudo",
      select_row: "Selecionar esta linha",
      show: "Ver",
      sort: "Ordenar",
      undo: "Desfazer",
      unselect: "Desmarcar",
      expand: "Expandir",
      close: "Fechar",
      open_menu: "Abrir menu",
      close_menu: "Fechar menu",
      update: "Atualizar",
      move_up: "Mover para cima",
      move_down: "Mover para baixo",
      open: "Abrir",
      toggle_theme: "Alternar modo claro/escuro",
      select_columns: "Colunas",
      update_application: "Recarregar aplicação",
    },
    boolean: {
      true: "Sim",
      false: "Não",
      null: " ",
    },
    page: {
      create: "Criar %{name}",
      dashboard: "Painel",
      edit: "%{name} %{recordRepresentation}",
      error: "Algo deu errado",
      list: "%{name}",
      loading: "Carregando",
      not_found: "Não encontrado",
      show: "%{name} %{recordRepresentation}",
      empty: "Nenhum registro de %{name} ainda.",
      invite: "Deseja adicionar um?",
      access_denied: "Acesso negado",
      authentication_error: "Erro de autenticação",
    },
    input: {
      file: {
        upload_several:
          "Solte alguns arquivos para enviar ou clique para selecionar um.",
        upload_single:
          "Solte um arquivo para enviar ou clique para selecioná-lo.",
      },
      image: {
        upload_several:
          "Solte algumas imagens para enviar ou clique para selecionar uma.",
        upload_single:
          "Solte uma imagem para enviar ou clique para selecioná-la.",
      },
      references: {
        all_missing: "Não foi possível encontrar os dados de referência.",
        many_missing:
          "Pelo menos uma das referências associadas parece não estar mais disponível.",
        single_missing:
          "A referência associada parece não estar mais disponível.",
      },
      password: {
        toggle_visible: "Ocultar senha",
        toggle_hidden: "Mostrar senha",
      },
    },
    message: {
      about: "Sobre",
      access_denied: "Você não tem permissão para acessar esta página",
      are_you_sure: "Tem certeza?",
      authentication_error:
        "O servidor de autenticação retornou um erro e suas credenciais não puderam ser verificadas.",
      auth_error: "Ocorreu um erro ao validar o token de autenticação.",
      bulk_delete_content:
        "Tem certeza de que deseja excluir este %{name}? |||| Tem certeza de que deseja excluir estes %{smart_count} itens?",
      bulk_delete_title: "Excluir %{name} |||| Excluir %{smart_count} %{name}",
      bulk_update_content:
        "Tem certeza de que deseja atualizar %{name} %{recordRepresentation}? |||| Tem certeza de que deseja atualizar estes %{smart_count} itens?",
      bulk_update_title:
        "Atualizar %{name} %{recordRepresentation} |||| Atualizar %{smart_count} %{name}",
      clear_array_input: "Tem certeza de que deseja limpar a lista inteira?",
      delete_content: "Tem certeza de que deseja excluir este %{name}?",
      delete_title: "Excluir %{name} %{recordRepresentation}",
      details: "Detalhes",
      error:
        "Ocorreu um erro no cliente e sua solicitação não pôde ser concluída.",
      invalid_form: "O formulário não é válido. Verifique os erros",
      loading: "Aguarde",
      no: "Não",
      not_found: "Você digitou uma URL incorreta ou seguiu um link inválido.",
      select_all_limit_reached:
        "Há elementos demais para selecionar todos. Apenas os primeiros %{max} foram selecionados.",
      unsaved_changes:
        "Algumas alterações não foram salvas. Tem certeza de que deseja ignorá-las?",
      yes: "Sim",
      placeholder_data_warning:
        "Problema de rede: falha ao atualizar os dados.",
    },
    navigation: {
      clear_filters: "Limpar filtros",
      no_filtered_results:
        "Nenhum resultado de %{name} encontrado com os filtros atuais.",
      no_results: "Nenhum resultado de %{name} encontrado",
      no_more_results:
        "A página %{page} está fora dos limites. Tente a página anterior.",
      page_out_of_boundaries: "Página %{page} fora dos limites",
      page_out_from_end: "Não é possível ir além da última página",
      page_out_from_begin: "Não é possível ir antes da página 1",
      page_range_info: "%{offsetBegin}-%{offsetEnd} de %{total}",
      partial_page_range_info:
        "%{offsetBegin}-%{offsetEnd} de mais de %{offsetEnd}",
      current_page: "Página %{page}",
      page: "Ir para a página %{page}",
      first: "Ir para a primeira página",
      last: "Ir para a última página",
      next: "Ir para a próxima página",
      previous: "Ir para a página anterior",
      page_rows_per_page: "Linhas por página:",
      skip_nav: "Pular para o conteúdo",
    },
    sort: {
      sort_by: "Ordenar por %{field_lower_first} %{order}",
      ASC: "crescente",
      DESC: "decrescente",
    },
    auth: {
      auth_check_error: "Faça login para continuar",
      user_menu: "Perfil",
      username: "Usuário",
      password: "Senha",
      email: "E-mail",
      sign_in: "Entrar",
      sign_in_error: "Falha na autenticação, tente novamente",
      logout: "Sair",
    },
    notification: {
      updated: "Elemento atualizado |||| %{smart_count} elementos atualizados",
      created: "Elemento criado",
      deleted: "Elemento excluído |||| %{smart_count} elementos excluídos",
      bad_item: "Elemento incorreto",
      item_doesnt_exist: "O elemento não existe",
      http_error: "Erro de comunicação com o servidor",
      data_provider_error:
        "Erro no dataProvider. Verifique o console para mais detalhes.",
      i18n_error: "Não foi possível carregar as traduções do idioma escolhido",
      canceled: "Ação cancelada",
      logged_out: "Sua sessão terminou, conecte-se novamente.",
      not_authorized: "Você não tem autorização para acessar este recurso.",
      application_update_available: "Uma nova versão está disponível.",
      offline: "Sem conexão. Não foi possível buscar os dados.",
    },
    validation: {
      required: "Obrigatório",
      minLength: "Deve ter pelo menos %{min} caracteres",
      maxLength: "Deve ter no máximo %{max} caracteres",
      minValue: "Deve ser no mínimo %{min}",
      maxValue: "Deve ser no máximo %{max}",
      number: "Deve ser um número",
      email: "Deve ser um e-mail válido",
      oneOf: "Deve ser um dos seguintes: %{options}",
      regex: "Deve corresponder a um formato específico (regexp): %{pattern}",
      unique: "Deve ser único",
    },
    saved_queries: {
      label: "Consultas salvas",
      query_name: "Nome da consulta",
      new_label: "Salvar consulta atual...",
      new_dialog_title: "Salvar consulta atual como",
      remove_label: "Remover consulta salva",
      remove_label_with_name: 'Remover consulta "%{name}"',
      remove_dialog_title: "Remover consulta salva?",
      remove_message:
        "Tem certeza de que deseja remover este item da sua lista de consultas salvas?",
      help: "Filtre a lista e salve esta consulta para depois",
    },
    guesser: {
      empty: {
        title: "Nenhum dado para exibir",
        message: "Verifique seu data provider",
      },
    },
    configurable: {
      customize: "Personalizar",
      configureMode: "Configurar esta página",
      inspector: {
        title: "Inspetor",
        content:
          "Passe o mouse sobre os elementos da interface para configurá-los",
        reset: "Redefinir configurações",
        hideAll: "Ocultar tudo",
        showAll: "Mostrar tudo",
      },
      Datagrid: {
        title: "Tabela",
        unlabeled: "Coluna sem rótulo #%{column}",
      },
      SimpleForm: {
        title: "Formulário",
        unlabeled: "Campo sem rótulo #%{input}",
      },
      SimpleList: {
        title: "Lista",
        primaryText: "Texto principal",
        secondaryText: "Texto secundário",
        tertiaryText: "Texto terciário",
      },
    },
  },
  "ra-supabase": {
    auth: {
      email: "E-mail",
      confirm_password: "Confirmar senha",
      sign_in_with: "Entrar com %{provider}",
      forgot_password: "Esqueceu a senha?",
      reset_password: "Redefinir senha",
      password_reset:
        "Verifique seus e-mails para encontrar a mensagem de redefinição de senha.",
      missing_tokens: "Os tokens de acesso e de atualização estão ausentes",
      back_to_login: "Voltar ao login",
    },
    reset_password: {
      forgot_password: "Esqueceu a senha?",
      forgot_password_details: "Informe seu e-mail para receber as instruções.",
    },
    set_password: {
      new_password: "Escolha sua senha",
    },
    validation: {
      password_mismatch: "As senhas não coincidem",
    },
  },
} satisfies TranslationMessages;
