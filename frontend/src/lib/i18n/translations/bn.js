import mergeTranslations from '../mergeTranslations';
import auth from './bn/auth';
import app from './bn/app';
import admin from './bn/admin';
import staticPages from './bn/static';

const existingMerged = {
  language: {
    label: 'ভাষা',
    en: 'English',
    bn: 'বাংলা',
  },
  nav: {
    home: 'হোম',
    browse: 'ব্রাউজ',
    about: 'আমাদের সম্পর্কে',
    faq: 'প্রশ্নোত্তর',
    dashboard: 'ড্যাশবোর্ড',
    myProperties: 'আমার সম্পত্তি',
    listYourProperty: 'সম্পত্তি তালিকাভুক্ত করুন',
    requests: 'অনুরোধ',
    myApplications: 'আমার আবেদন',
    wishlist: 'উইশলিস্ট',
    topupApprovals: 'টপ-আপ অনুমোদন',
    listings: 'তালিকা',
  },
  header: {
    login: 'লগ ইন',
    signup: 'সাইন আপ',
    wallet: 'ওয়ালেট',
    account: 'অ্যাকাউন্ট',
    accountSettings: 'অ্যাকাউন্ট সেটিংস',
    logout: 'লগ আউট',
    openMenu: 'মেনু খুলুন',
    closeMenu: 'মেনু বন্ধ করুন',
    mainMenu: 'প্রধান মেনু',
    openUserMenu: 'ব্যবহারকারী মেনু খুলুন',
  },
  roles: {
    owner: 'মালিক',
    tenant: 'ভাড়াটিয়া',
    admin: 'অ্যাডমিন',
    member: 'সদস্য',
  },
  userMenu: {
    dashboard: 'ড্যাশবোর্ড',
    accountSettings: 'অ্যাকাউন্ট সেটিংস',
    logout: 'লগ আউট',
    wallet: 'ওয়ালেট',
    notifications: 'নোটিফিকেশন',
  },
  home: {
    heroTitle: 'আপনার পছন্দের বাড়ি খুঁজুন,',
    heroTitleBreak: 'দালাল ছাড়াই',
    heroSubtitle: 'বাংলাদেশে মালিক ও ভাড়াটিয়াকে সরাসরি সংযুক্ত করছি।',
    heroSubtitleLine1: 'বাংলাদেশে মালিক ও ভাড়াটিয়াকে',
    heroSubtitleLine2: 'সরাসরি সংযুক্ত করছি।',
    heroImageAlt: 'ভাড়া বাড়িতে সুখী দম্পতি',
    statVerifiedTitle: 'যাচাইকৃত তালিকা',
    statVerifiedSubtitle: 'নিরাপদ ও বিশ্বস্ত সম্পত্তি',
    statTenantTitle: 'ভাড়াটিয়া যাচাই',
    statTenantSubtitle: 'মানসিক শান্তির জন্য ব্যাকগ্রাউন্ড চেক',
    statAgreementsTitle: 'ভাড়া চুক্তি',
    statAgreementsSubtitle: 'আইনি চুক্তি সহজে',
    statCollectionTitle: 'ভাড়া সংগ্রহ',
    statCollectionSubtitle: 'ঝামেলামুক্ত পেমেন্ট ব্যবস্থাপনা',
    featuredTitle: 'বৈশিষ্ট্যযুক্ত সম্পত্তি',
    featuredSubtitle: 'আপনার এলাকার জনপ্রিয় তালিকা',
    noFeatured: 'এখন কোনো বৈশিষ্ট্যযুক্ত সম্পত্তি নেই।',
    reviewsTitle: 'ভাড়াটিয়াদের পছন্দ',
    reviewsSubtitle: 'আমাদের কমিউনিটির নির্বাচিত রিভিউ',
    reviewsEmpty: 'কমিউনিটি অভিজ্ঞতা শেয়ার করলে রিভিউ এখানে দেখাবে।',
    giveReview: 'আপনার রিভিউ দিন',
    ctaBadge: 'যাচাইকৃত সম্পত্তি, বিশ্বস্ত মানুষ',
    getStarted: 'শুরু করুন',
  },
  search: {
    area: 'এলাকা',
    search: 'খুঁজুন',
  },
  footer: {
    contact: 'যোগাযোগ:',
    email: 'ইমেইল:',
    address: 'ঠিকানা:',
    copyright: '© কপিরাইট ২০২৬ রেন্ট নাও লিমিটেড। সর্বস্বত্ব সংরক্ষিত।',
    about: 'আমাদের সম্পর্কে',
    terms: 'শর্তাবলী',
    faq: 'প্রশ্নোত্তর',
    services: 'সেবা',
    reviews: 'রিভিউ',
  },
};

export default mergeTranslations(existingMerged, auth, app, { admin }, staticPages);
