# Immo-Visio — Gestion Locative Meublée

Application web mobile-first pour la gestion d'un complexe de 3 logements meublés à Lomé, Togo.

## Fonctionnalités

- **Tableau de bord** — CA, charges, bénéfice, taux d'occupation, progression remboursement prêt
- **Réservations** — Création, filtres, calendrier, tarifs automatiques
- **Finances** — Dépenses (avec alertes > 50 000 FCFA), encaissements, bilans mensuels
- **Messagerie** — Chat temps réel entre les deux associés
- **Profil** — Infos du complexe, déconnexion

## Stack technique

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Tailwind CSS v4**
- **Vercel** (déploiement)

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd immo-visio
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier `.env.example` → `.env.local` et remplir les clés :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Exécuter le SQL dans **SQL Editor** de Supabase :
   - Ouvrir `supabase/schema.sql`
   - Copier-coller et exécuter

### 3. Créer les utilisateurs

Dans **Supabase Dashboard → Authentication → Users**, créer deux utilisateurs :

| Nom | Email | Mot de passe |
|-----|-------|-------------|
| RHODES | (votre email) | (votre choix) |
| BOMBOMA | (email de BOMBOMA) | (votre choix) |

### 4. Activer le Realtime

Dans **Supabase Dashboard → Database → Replication**, activer le realtime sur la table `messages`.

### 5. Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### 6. Déployer sur Vercel

1. Connecter le repo GitHub sur [vercel.com](https://vercel.com)
2. Ajouter les variables d'environnement (les 3 clés Supabase)
3. Déployer

## Structure du projet

```
src/
├── app/
│   ├── (app)/              # Pages protégées (layout avec navigation)
│   │   ├── page.tsx        # Tableau de bord
│   │   ├── reservations/   # CRUD réservations
│   │   ├── finances/       # Dépenses, encaissements, bilans
│   │   ├── messages/       # Messagerie interne
│   │   └── profil/         # Profil utilisateur
│   ├── connexion/          # Page de connexion
│   └── auth/callback/      # Callback Supabase Auth
├── components/             # Composants réutilisables
├── lib/
│   ├── supabase/           # Clients Supabase (client, server, middleware)
│   └── utils.ts            # Fonctions utilitaires
└── types/
    └── database.ts         # Types TypeScript + constantes métier
```

## Tarifs des logements

| Logement | Nuit | Mois |
|----------|------|------|
| Appartement Premium (2 ch.) | 50 000 FCFA | 680 000 FCFA |
| Appartement Standard (1 ch.) | 30 000 FCFA | 430 000 FCFA |
| Studio | 15 000 FCFA | 200 000 FCFA |
