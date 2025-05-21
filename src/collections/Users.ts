import type { CollectionConfig } from 'payload'
type AuthUser = {
  id: number
  role?: string
  tenant?: string | number
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    // No custom tokenPayload here; use afterLogin hook below
  },
  access: {
    // For reading a single user (with id), only allow if user is admin in same tenant or self in same tenant
    read: ({ req: { user }, id }) => {
      if (!user) return false;
      const u = user as AuthUser;
      if (typeof id !== 'undefined') {
        // Single record: allow if admin in same tenant, or self in same tenant
        if (u.role === 'admin' && u.tenant) return true;
        return u.id === id && !!u.tenant;
      }
      // For reading many: admins see all users in their tenant, recruiters only themselves
      if (u.role === 'admin' && u.tenant) {
        return { tenant: { equals: u.tenant } };
      }
      if (u.tenant) {
        const filter: Record<string, any> = { tenant: { equals: u.tenant } };
        if (typeof u.id !== 'undefined') {
          filter.id = { equals: u.id };
        }
        return filter;
      }
      return false;
    },
    // Only admins can create users for their tenant
    create: ({ req: { user } }) => {
      const u = user as AuthUser;
      return !!u && u.role === 'admin';
    },
    // For updating: admin can update users in their tenant, recruiter only themselves
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      const u = user as AuthUser;
      if (typeof id !== 'undefined') {
        if (u.role === 'admin' && u.tenant) return true;
        return u.id === id && !!u.tenant;
      }
      if (u.role === 'admin' && u.tenant) {
        return { tenant: { equals: u.tenant } };
      }
      if (u.tenant) {
        const filter: Record<string, any> = { tenant: { equals: u.tenant } };
        if (typeof u.id !== 'undefined') {
          filter.id = { equals: u.id };
        }
        return filter;
      }
      return false;
    },
    // Only admins can delete users in their tenant
    delete: ({ req: { user }, id }) => {
      if (!user) return false;
      const u = user as AuthUser;
      if (typeof id !== 'undefined') {
        return u.role === 'admin' && !!u.tenant;
      }
      if (u.role === 'admin' && u.tenant) {
        return { tenant: { equals: u.tenant } };
      }
      return false;
    },
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'The tenant this user belongs to',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Recruiter', value: 'recruiter' },
      ],
      defaultValue: 'recruiter',
      admin: {
        description: 'User role within the tenant',
      },
    },
    // Email added by default
    // Add more fields as needed
  ],
  hooks: {
    afterLogin: [
      async ({ user, token }) => {
        // Add tenant and role to JWT payload
        const baseToken = (typeof token === 'object' && token !== null) ? token : {};
        return {
          token: {
            ...baseToken,
            tenant: user.tenant,
            role: user.role,
          },
        }
      },
    ],
  },
}
