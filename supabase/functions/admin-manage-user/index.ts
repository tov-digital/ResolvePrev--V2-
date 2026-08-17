import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Cabeçalho de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: `Sessão inválida ou expirada: ${userError?.message || 'Token incorreto'}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ADMIN_USER_ID = '91a1904c-8f54-4943-bc8c-0b97cbcdcd26'
    let isAdmin = callerUser.id === ADMIN_USER_ID

    if (!isAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, is_admin')
        .eq('id', callerUser.id)
        .maybeSingle()

      if (profile && (profile.role === 'admin' || profile.is_admin === true)) {
        isAdmin = true
      }
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem executar esta operação.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { action, userId, email, password, name, role } = body

    // 1. CRIAR USUÁRIO NO AUTH E PROFILES
    if (action === 'createUser') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'E-mail e senha são obrigatórios.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: name || '', role: role || 'user' }
      })

      if (createError) throw createError

      if (newUser && newUser.user) {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', newUser.user.id)
          .maybeSingle()

        const profilePayload: Record<string, any> = {
          id: newUser.user.id,
          email: email,
          role: role || 'user',
          updated_at: new Date().toISOString()
        }

        if (name) {
          if (existingProfile) {
            if ('full_name' in existingProfile) profilePayload.full_name = name
            if ('nome' in existingProfile) profilePayload.nome = name
            if ('name' in existingProfile) profilePayload.name = name
          } else {
            profilePayload.full_name = name
            profilePayload.nome = name
          }
        }

        const { error: pErr } = await supabaseAdmin.from('profiles').upsert(profilePayload, { onConflict: 'id' })
        if (pErr) {
          await supabaseAdmin.from('profiles').upsert({
            id: newUser.user.id,
            email: email,
            role: role || 'user',
            full_name: name
          }, { onConflict: 'id' })
        }
      }

      return new Response(
        JSON.stringify({ message: 'Usuário criado com sucesso!', user: newUser.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. ATUALIZAR USUÁRIO (SENHA, E-MAIL, NOME, ROLE)
    if (action === 'updateUser') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário não fornecido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (password && password.trim() !== '' && password.trim().length < 6) {
        return new Response(
          JSON.stringify({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateAttrs: Record<string, any> = {}
      if (password && password.trim() !== '') {
        updateAttrs.password = password.trim()
      }
      if (email && email.trim() !== '') {
        updateAttrs.email = email.trim()
      }

      // Tentar atualizar no auth.users
      if (Object.keys(updateAttrs).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateAttrs)
        
        if (updateAuthError) {
          // Se o usuário não existir no Auth ainda, criar a conta no Auth
          if (updateAuthError.message && updateAuthError.message.toLowerCase().includes('not found') && email && password) {
            const { error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
              email: email,
              password: password,
              email_confirm: true,
              user_metadata: { full_name: name || '' }
            })
            if (createAuthError) throw createAuthError
          } else {
            throw updateAuthError
          }
        }
      }

      // Consultar perfil existente para mapear colunas ativas
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      const profileUpdates: Record<string, any> = {
        updated_at: new Date().toISOString()
      }
      if (email) profileUpdates.email = email
      if (role) profileUpdates.role = role

      if (name) {
        if (existingProfile) {
          if ('full_name' in existingProfile) profileUpdates.full_name = name
          if ('nome' in existingProfile) profileUpdates.nome = name
          if ('name' in existingProfile) profileUpdates.name = name
        } else {
          profileUpdates.full_name = name
          profileUpdates.nome = name
        }
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (profileError) {
        await supabaseAdmin.from('profiles').upsert({ id: userId, ...profileUpdates }, { onConflict: 'id' })
      }

      return new Response(
        JSON.stringify({ message: 'Dados e senha do usuário atualizados com sucesso no Supabase!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. EXCLUIR USUÁRIO DO AUTH E PROFILES
    if (action === 'deleteUser') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário não fornecido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteAuthError) console.warn('Aviso ao deletar do Auth:', deleteAuthError.message)

      await supabaseAdmin.from('profiles').delete().eq('id', userId)

      return new Response(
        JSON.stringify({ message: 'Usuário excluído com sucesso!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno no servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
