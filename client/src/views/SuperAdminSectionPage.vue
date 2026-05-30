<template>
  <AppLayout>
    <section class="section-page">
      <header>
        <span class="eyebrow">Super Admin</span>
        <h1>{{ page.title }}</h1>
        <p>{{ page.description }}</p>
      </header>

      <div class="module-grid">
        <article v-for="item in page.items" :key="item.title">
          <strong>{{ item.title }}</strong>
          <small>{{ item.text }}</small>
        </article>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'

const route = useRoute()

const pages = {
  databases: {
    title: 'Databases',
    description: 'Monitor school database provisioning, storage use, and data isolation.',
    items: [
      { title: 'Provisioning', text: 'Track database setup for new schools.' },
      { title: 'Storage', text: 'Review storage usage and capacity warnings.' },
      { title: 'Isolation', text: 'Verify each school remains separated.' }
    ]
  },
  billing: {
    title: 'Billing',
    description: 'Manage subscriptions, revenue, expiring plans, and payment issues.',
    items: [
      { title: 'Monthly Revenue', text: 'Track recurring revenue and plan movement.' },
      { title: 'Subscriptions', text: 'Review active, expiring, and expired plans.' },
      { title: 'Payment Issues', text: 'Prioritize schools needing billing follow-up.' }
    ]
  },
  activity: {
    title: 'Activity',
    description: 'Review platform events, audit activity, and administrative changes.',
    items: [
      { title: 'Timeline', text: 'See recent platform activity across schools.' },
      { title: 'Audit Logs', text: 'Search and export security-sensitive actions.' },
      { title: 'Admin Actions', text: 'Track changes made by platform administrators.' }
    ]
  },
  reports: {
    title: 'Reports',
    description: 'Generate exports and operational reports for platform management.',
    items: [
      { title: 'School Reports', text: 'Export school portfolio and setup data.' },
      { title: 'DOS Reports', text: 'Export DOS ownership and activity data.' },
      { title: 'Audit Reports', text: 'Prepare security and compliance reports.' }
    ]
  },
  administration: {
    title: 'Administration',
    description: 'Access platform tools that do not belong on the main dashboard.',
    items: [
      { title: 'Export Center', text: 'Download platform datasets.' },
      { title: 'Announcement Center', text: 'Send platform-wide announcements.' },
      { title: 'Maintenance Mode', text: 'Control planned maintenance messaging.' },
      { title: 'Backup Management', text: 'Track backups and recovery readiness.' },
      { title: 'Role Permissions', text: 'Manage platform permission boundaries.' }
    ]
  }
}

const page = computed(() => {
  const section = String(route.params.section || route.path.split('/').pop() || '')
  return pages[section] || pages.administration
})
</script>

<style scoped>
.section-page {
  --section-surface: rgba(255, 255, 255, 0.96);
  --section-border: rgba(219, 234, 254, 0.9);
  --section-heading: #0f172a;
  --section-muted: #64748b;
  --section-eyebrow: #2563eb;
  --section-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
  width: min(100%, 1480px);
  display: grid;
  gap: 1rem;
  margin: 0 auto;
}

:global(body.admin-dark-mode) .section-page {
  --section-surface: #111827;
  --section-border: #334155;
  --section-heading: #f8fafc;
  --section-muted: #cbd5e1;
  --section-eyebrow: #93c5fd;
  --section-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
}

header,
.module-grid article {
  border: 1px solid var(--section-border);
  border-radius: 16px;
  background: var(--section-surface);
  box-shadow: var(--section-shadow);
  padding: 1.25rem;
}

h1 {
  margin: 0;
  color: var(--section-heading);
  font-weight: 950;
}

p,
small {
  color: var(--section-muted);
}

.eyebrow {
  color: var(--section-eyebrow);
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.module-grid article {
  display: grid;
  gap: 0.35rem;
}

.module-grid strong {
  color: var(--section-heading);
}
</style>
