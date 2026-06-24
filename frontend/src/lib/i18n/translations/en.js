import mergeTranslations from '../mergeTranslations';
import auth from './en/auth';
import app from './en/app';
import admin from './en/admin';
import staticPages from './en/static';

const existingMerged = {
  language: {
    label: 'Language',
    en: 'English',
    bn: 'Bangla',
  },
  nav: {
    home: 'Home',
    browse: 'Browse',
    about: 'About',
    faq: 'FAQ',
    dashboard: 'Dashboard',
    myProperties: 'My Properties',
    listYourProperty: 'List Your Property',
    requests: 'Requests',
    myApplications: 'My Applications',
    wishlist: 'Wishlist',
    topupApprovals: 'Top-up Approvals',
    listings: 'Listings',
  },
  header: {
    login: 'Log In',
    signup: 'Sign Up',
    wallet: 'Wallet',
    account: 'Account',
    accountSettings: 'Account Settings',
    logout: 'Logout',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainMenu: 'Main menu',
    openUserMenu: 'Open user menu',
  },
  roles: {
    owner: 'Owner',
    tenant: 'Tenant',
    admin: 'Admin',
    member: 'Member',
  },
  userMenu: {
    dashboard: 'Dashboard',
    accountSettings: 'Account settings',
    logout: 'Log out',
    wallet: 'Wallet',
    notifications: 'Notifications',
  },
  home: {
    heroTitle: 'Find Your Perfect Home,',
    heroTitleBreak: 'No Brokers Needed',
    heroSubtitle: 'Connecting Owners & Tenants Directly in Bangladesh.',
    heroImageAlt: 'Happy couple with rented home',
    statVerifiedTitle: 'Verified Listings',
    statVerifiedSubtitle: 'Safe & Trusted Properties',
    statTenantTitle: 'Tenant Verification',
    statTenantSubtitle: 'Background checks for peace of mind',
    statAgreementsTitle: 'Rent Agreements',
    statAgreementsSubtitle: 'Legal contracts made easy',
    statCollectionTitle: 'Rent Collection',
    statCollectionSubtitle: 'Hassle-free payment management',
    featuredTitle: 'Featured Properties',
    featuredSubtitle: 'Popular Listings in Your Area',
    noFeatured: 'No featured properties available right now.',
    reviewsTitle: 'Loved by renters',
    reviewsSubtitle: 'Featured reviews from our community',
    reviewsEmpty: 'Reviews will appear here once the community shares their experiences.',
    giveReview: 'Give us your review',
    ctaBadge: 'Verified properties, trusted people',
    getStarted: 'Get Started',
  },
  search: {
    area: 'Area',
    search: 'Search',
  },
  footer: {
    contact: 'Contact:',
    email: 'Email:',
    address: 'Address:',
    copyright: '© Copyright 2026 Rent Nao Limited. All rights reserved.',
    about: 'About',
    terms: 'Terms',
    faq: 'FAQ',
    services: 'Services',
    reviews: 'Reviews',
  },
};

export default mergeTranslations(existingMerged, auth, app, { admin }, staticPages);
