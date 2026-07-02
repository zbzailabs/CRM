const requiredEnv = [
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRM_ADMIN_EMAIL",
  "CRM_ADMIN_PASSWORD",
];

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.CRM_ADMIN_EMAIL.toLowerCase();
const adminPassword = process.env.CRM_ADMIN_PASSWORD;
const firstName = process.env.CRM_ADMIN_FIRST_NAME || "云合";
const lastName = process.env.CRM_ADMIN_LAST_NAME || "管理员";

const headers = {
  apikey: serviceRoleKey,
  authorization: `Bearer ${serviceRoleKey}`,
  "content-type": "application/json",
};

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.message || body?.error_description || text;
    throw new Error(`${options.method || "GET"} ${path} failed: ${message}`);
  }

  return body;
};

const listUsers = async () => {
  const users = [];
  let page = 1;

  for (;;) {
    const body = await request(
      `/auth/v1/admin/users?page=${page}&per_page=100`,
    );
    const pageUsers = body?.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < 100) {
      return users;
    }
    page += 1;
  }
};

const findUserByEmail = async () => {
  const users = await listUsers();
  return users.find((user) => user.email?.toLowerCase() === adminEmail);
};

let user = await findUserByEmail();

if (!user) {
  user = await request("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    }),
  });
  log(`Created auth user: ${adminEmail}`);
} else {
  user = await request(`/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify({
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    }),
  });
  log(`Updated auth user: ${adminEmail}`);
}

const sales = await request(
  `/rest/v1/sales?email=eq.${encodeURIComponent(adminEmail)}&select=*`,
);

if (sales.length === 0) {
  await request("/rest/v1/sales", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email: adminEmail,
      first_name: firstName,
      last_name: lastName,
      user_id: user.id,
      administrator: true,
      disabled: false,
    }),
  });
  log(`Created CRM administrator sale: ${adminEmail}`);
} else {
  await request(`/rest/v1/sales?id=eq.${sales[0].id}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      user_id: user.id,
      administrator: true,
      disabled: false,
    }),
  });
  log(`Updated CRM administrator sale: ${adminEmail}`);
}

log("CRM administrator account is ready.");
