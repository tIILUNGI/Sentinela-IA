PT_MESSAGES = {
    "Invalid credentials": "Credenciais inválidas.",
    "Email already registered": "Este email já está registado.",
    "Not authenticated": "Não autenticado.",
    "Invalid token": "Token inválido.",
    "Invalid token type": "Tipo de token inválido.",
    "Invalid refresh token": "Token de renovação inválido.",
    "User inactive": "Utilizador inativo.",
    "User inactive or not found": "Utilizador inativo ou inexistente.",
    "User not found": "Utilizador não encontrado.",
    "No active organization membership": "Sem associação ativa a uma organização.",
    "Not a member of this organization": "Não é membro desta organização.",
    "No active membership": "Sem associação ativa.",
    "Membership required": "Associação obrigatória.",
    "Membership not found": "Associação não encontrada.",
    "Organization not found": "Organização não encontrada.",
    "No organization found": "Nenhuma organização encontrada.",
    "Only super admin can create organizations": "Apenas o super admin pode criar organizações.",
    "Slug already exists": "O identificador já existe.",
    "Not allowed": "Não autorizado.",
    "Insufficient permissions": "Permissões insuficientes.",
    "Role not found": "Perfil não encontrado.",
    "User already in organization": "O utilizador já pertence à organização.",
    "Invalid X-Organization-ID": "Cabeçalho X-Organization-ID inválido.",
    "Incident not found": "Incidente não encontrado.",
    "Document not found": "Documento não encontrado.",
    "Evidence not found": "Evidência não encontrada.",
    "Risk assessment not found": "Avaliação de risco não encontrada.",
    "Recommendation not found": "Recomendação não encontrada.",
    "Task not found": "Tarefa não encontrada.",
    "File too large (max 20MB)": "Ficheiro demasiado grande (máx. 20MB).",
    "Only PDF, DOCX and TXT files are allowed": "Apenas ficheiros PDF, DOCX e TXT são permitidos.",
    "Document not ready": "Documento ainda não está pronto.",
    "AI unavailable": "IA indisponível.",
    "AI analysis failed": "A análise de IA falhou.",
    "Analysis failed": "A análise falhou.",
    "incident_id is required": "incident_id é obrigatório.",
    "Unsupported file type": "Tipo de ficheiro não suportado.",
    "Invalid or expired reset token": "Ligação de reposição inválida ou expirada.",
    "Password updated. You can now sign in.": "Palavra-passe atualizada. Já pode iniciar sessão.",
    "If this email is registered, a password reset link has been created.": "Se este email estiver registado, foi criada uma ligação de reposição.",
}


def localize_detail(detail: str, accept_language: str | None) -> str:
    if not detail or not accept_language or not accept_language.lower().startswith("pt"):
        return detail
    if detail in PT_MESSAGES:
        return PT_MESSAGES[detail]
    for en, pt in PT_MESSAGES.items():
        if detail.startswith(en):
            return pt + detail[len(en):]
    return detail
