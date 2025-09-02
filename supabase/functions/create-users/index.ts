const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test users to create
    const users = [
      {
        email: 'admin@duran.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'Admin'
      },
      {
        email: 'gerente@duran.com',
        password: 'gerente123',
        name: 'Gerente General',
        role: 'Gerente'
      },
      {
        email: 'empleado@duran.com',
        password: 'empleado123',
        name: 'Empleado',
        role: 'Empleado'
      }
    ]

    const results = []

    for (const userData of users) {
      // First, check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUser?.users?.some(u => u.email === userData.email)
      
      if (userExists) {
        results.push({ email: userData.email, success: true, message: 'User already exists' })
        continue
      }

      // Create auth user with admin privileges
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      })

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError)
        results.push({ email: userData.email, success: false, error: authError.message })
        continue
      }

      if (!authUser?.user?.id) {
        results.push({ email: userData.email, success: false, error: 'No user ID returned from auth creation' })
        continue
      }

      // Create user profile in users table with auth_id
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          auth_id: authUser.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        }, {
          onConflict: 'email'
        })

      if (profileError) {
        console.error(`Error creating user profile ${userData.email}:`, profileError)
        results.push({ email: userData.email, success: false, error: profileError.message })
      } else {
        results.push({ 
          email: userData.email, 
          success: true, 
          message: 'User created successfully',
          auth_id: authUser.user.id
        })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})