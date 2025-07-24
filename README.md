# Referral-Based Waitlist System

A full-stack demo project showcasing a referral-based waitlist system built with Next.js, TailwindCSS, and Supabase.

## 🚀 Features

### ✅ Core Functionality

- **User Authentication**: Secure signup/signin with Supabase Auth
- **Referral System**: Unique referral codes and link tracking
- **Waitlist Management**: Position-based ranking system
- **Leaderboard**: Real-time competition between users
- **Anti-Fraud Protection**: Cookie/IP-based deduplication and rate limiting

### ✅ User Experience

- **Mobile-First Design**: Responsive layout with TailwindCSS
- **Modern UI**: HeroUI/NextUI-inspired components
- **Real-time Updates**: Live leaderboard and stats
- **Share Functionality**: Native sharing and copy-to-clipboard
- **Progress Tracking**: Visual waitlist position indicators

### ✅ Technical Features

- **Modular Architecture**: Clean separation of concerns
- **Type Safety**: Full TypeScript implementation
- **Environment Variables**: Secure configuration management
- **Error Handling**: Comprehensive error states and feedback
- **Performance**: Optimized loading and caching
- **HubSpot CRM Integration**: Automatic user and referral tracking

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with React 18
- **Styling**: TailwindCSS with custom components
- **Backend**: Supabase (Auth + Database)
- **Language**: TypeScript
- **UI Components**: HeadlessUI + Heroicons
- **State Management**: React Hooks + Custom Hooks
- **CRM Integration**: HubSpot API for contact management

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # User dashboard
│   ├── leaderboard/       # Public leaderboard
│   ├── ref/[code]/        # Referral landing pages
│   ├── signup/           # User registration
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # Reusable UI components
│   ├── Button.tsx        # Custom button component
│   ├── Input.tsx         # Form input component
│   ├── ReferralCard.tsx  # Referral sharing card
│   └── WaitlistRank.tsx  # Waitlist position display
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Authentication hook
├── lib/                  # Configuration files
│   └── supabase.ts       # Supabase client config
├── services/             # Business logic services
│   ├── userService.ts    # User management
│   ├── referralService.ts # Referral logic
│   ├── hubspotService.ts # HubSpot CRM integration
│   └── supabaseClient.ts # Database operations
└── utils/                # Utility functions
    ├── generateReferralCode.ts # Code generation
    ├── parseReferral.ts  # URL parsing
    └── antiFraud.ts      # Fraud prevention
```

## 🗄 Database Schema

### Users Table

```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL UNIQUE,
    username text,
    referral_code text NOT NULL UNIQUE,
    is_verified boolean NOT NULL DEFAULT FALSE,
    referral_count integer NOT NULL DEFAULT 0,
    last_referral_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

### Referrals Table

```sql
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.users(id),
    referred_user_id uuid REFERENCES public.users(id),
    referred_email text NOT NULL,
    referred_ip inet,
    status public.referral_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Referral Status Enum

```sql
CREATE TYPE public.referral_status AS ENUM ('pending', 'verified', 'cancelled');
```

### Leaderboard View

```sql
CREATE VIEW public.leaderboard AS
SELECT
    u.id,
    u.username,
    u.referral_code,
    u.referral_count as total_referrals,
    ROW_NUMBER() OVER (ORDER BY u.referral_count DESC, u.created_at ASC) as rank
FROM public.users u
ORDER BY u.referral_count DESC, u.created_at ASC;
```

### Trigger System

The system includes a trigger that automatically handles referral verification:

```sql
-- Trigger function to handle pending -> verified transition
CREATE OR REPLACE FUNCTION public.handle_referral_verified()
RETURNS trigger AS $$
BEGIN
    -- Check if status is changing from pending to verified
    IF OLD.status = 'pending' AND NEW.status = 'verified' THEN
        -- Update the referrer's stats
        UPDATE public.users 
        SET 
            referral_count = referral_count + 1,
            last_referral_at = now()
        WHERE id = NEW.referrer_id;
    END IF;
    
    -- Always update the updated_at timestamp
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to referrals.status updates
CREATE TRIGGER trg_referral_status_change
    AFTER UPDATE OF status ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_referral_verified();
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd referral-system-demo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project
2. Run the SQL schema from `database-schema.sql` file
3. Get your project URL and anon key

### 4. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
HUBSPOT_API_KEY=your_hubspot_api_token
```

### 5. Set Up HubSpot Integration (Optional)

1. Create a HubSpot private app and get your API token
2. Create custom contact properties: `referral_count`, `last_referral_at`, `is_verified`, `referral_code`
3. Add your HubSpot API token to `.env.local`
4. See `HUBSPOT_SETUP.md` for detailed instructions

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 7. Test HubSpot Integration

```bash
npm run test:hubspot
```

## 🔧 Configuration

### Supabase Setup

1. **Authentication**: Enable email/password auth in Supabase dashboard
2. **Database Schema**: Run the `database-schema.sql` file in the SQL editor
3. **Row Level Security**: RLS policies are included in the schema
4. **Email Templates**: Customize email confirmation templates
5. **Real-time**: Enable real-time subscriptions for live updates

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 📱 Usage

### For Users

1. **Sign Up**: Create an account at `/signup`
2. **Get Referral Code**: Receive unique referral code automatically
3. **Share Link**: Share your referral link with friends
4. **Track Progress**: Monitor referrals and waitlist position
5. **Compete**: View leaderboard and climb rankings

### For Developers

1. **Customize Components**: Modify UI components in `/components`
2. **Add Features**: Extend services in `/services`
3. **Update Logic**: Modify utility functions in `/utils`
4. **Style Changes**: Update Tailwind classes or add custom CSS

## 🛡 Security Features

### Anti-Fraud Measures

- **Cookie Tracking**: Prevents duplicate referrals from same browser
- **IP Deduplication**: Tracks referral sources by IP address
- **Rate Limiting**: Prevents spam referrals (5 per hour per user)
- **Email Validation**: Requires email confirmation for valid referrals
- **User Agent Detection**: Blocks bot traffic

### Data Protection

- **Row Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **Error Handling**: Secure error messages without data leakage
- **HTTPS Only**: Secure communication in production

## 🎨 Customization

### Styling

- **TailwindCSS**: Easy customization with utility classes
- **Component Variants**: Multiple button and input styles
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Ready for dark theme implementation

### Features

- **Referral Logic**: Customizable referral validation rules
- **Waitlist Algorithm**: Adjustable ranking system
- **Leaderboard**: Configurable display options
- **Email Templates**: Customizable notification emails

## 🧪 Testing

### Manual Testing

1. **Signup Flow**: Test referral code detection
2. **Referral Tracking**: Verify referral counting
3. **Leaderboard**: Check ranking accuracy
4. **Mobile Responsiveness**: Test on various devices

### Automated Testing (Future)

- Unit tests for utility functions
- Integration tests for services
- E2E tests for user flows
- Performance testing

## 📊 Analytics & Monitoring

### Built-in Analytics

- Referral conversion rates
- User engagement metrics
- Leaderboard activity
- Fraud detection alerts

### Monitoring

- Error tracking and logging
- Performance monitoring
- User behavior analytics
- Database query optimization

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms

- **Netlify**: Similar to Vercel setup
- **Railway**: Full-stack deployment
- **AWS**: Custom infrastructure setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔗 HubSpot CRM Integration

### Features

- **Automatic User Sync**: New users are automatically created as HubSpot contacts
- **Referral Tracking**: Referral activities are logged as notes in HubSpot
- **Real-time Updates**: Referral counts and stats sync in real-time
- **Activity History**: Complete referral history tracked in HubSpot
- **Bulk Sync**: Sync existing users with one-click operation

### Setup

1. **Create HubSpot Private App**:
   - Go to HubSpot Settings → Integrations → Private Apps
   - Create app with required scopes: `crm.objects.contacts.read/write`, `crm.objects.notes.read/write`

2. **Create Custom Properties**:
   - `referral_count` (Number)
   - `last_referral_at` (Date/Time)
   - `referral_code` (Single-line text)

3. **Configure Environment**:
   - Add `HUBSPOT_API_KEY` to your `.env.local` file

4. **Test Integration**:
   - Run `npm run test:hubspot` to verify setup
   - Use the dashboard sync tools to sync existing users

### Data Flow

1. **User Registration** → HubSpot contact created
2. **Referral Creation** → Activity note logged
3. **Referral Verification** → Contact stats updated
4. **Real-time Sync** → All changes reflected in HubSpot

See `HUBSPOT_SETUP.md` for detailed configuration instructions.

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Advanced fraud detection
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Mobile app version
- [ ] Advanced HubSpot workflows
- [ ] Email automation integration

---

Built with ❤️ using Next.js, TailwindCSS, and Supabase
