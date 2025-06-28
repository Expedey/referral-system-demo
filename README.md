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

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with React 18
- **Styling**: TailwindCSS with custom components
- **Backend**: Supabase (Auth + Database)
- **Language**: TypeScript
- **UI Components**: HeadlessUI + Heroicons
- **State Management**: React Hooks + Custom Hooks

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
│   └── supabaseClient.ts # Database operations
└── utils/                # Utility functions
    ├── generateReferralCode.ts # Code generation
    ├── parseReferral.ts  # URL parsing
    └── antiFraud.ts      # Fraud prevention
```

## 🗄 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  username TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT REFERENCES users(referral_code),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Referrals Table

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  referred_email TEXT NOT NULL,
  referred_ip TEXT,
  referred_cookie TEXT,
  is_valid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Leaderboard View

```sql
CREATE VIEW leaderboard AS
SELECT
  u.id,
  u.username,
  u.referral_code,
  COUNT(r.id) as total_referrals,
  ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC) as rank
FROM users u
LEFT JOIN referrals r ON u.id = r.referrer_id AND r.is_valid = true
GROUP BY u.id, u.username, u.referral_code
ORDER BY total_referrals DESC;
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
2. Run the SQL schema provided above
3. Get your project URL and anon key

### 4. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Configuration

### Supabase Setup

1. **Authentication**: Enable email/password auth in Supabase dashboard
2. **Row Level Security**: Configure RLS policies for data protection
3. **Email Templates**: Customize email confirmation templates
4. **Real-time**: Enable real-time subscriptions for live updates

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

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Advanced fraud detection
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Mobile app version

---

Built with ❤️ using Next.js, TailwindCSS, and Supabase
