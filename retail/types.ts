
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

export interface HeroContent {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
}

export interface ContactContent {
  email: string;
  phone: string;
}

export interface GlobalImages {
  logo: string | null; // Base64 or URL
  heroDashboard: string;
  backgroundImage: string | null; // New field for global background
}

export interface EcosystemItem {
  id: string;
  title: string;
  description: string;
  icon: string; // String name of the icon (e.g., 'Monitor')
  bgClass: string;
}

export interface FeatureBlock {
  id: string;
  tagline: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  layout: 'left' | 'right';
  visualType: 'image' | 'custom_kiosk_ui' | 'custom_joint_ui' | 'custom_admin_ui'; // To preserve special visuals
}

export interface HardwareItem {
  title: string;
  description: string;
  icon: string;
}

export interface HardwareSection {
  title: string;
  subtitle: string;
  items: HardwareItem[];
}

export interface ProductItem {
  id: string;
  category: 'kiosk' | 'pos';
  name: string;
  description: string;
  image: string;
  specs: string[];
  pricePurchase: string;
  priceRent: string;
}

export interface SiteContent {
  images: GlobalImages;
  hero: HeroContent;
  ecosystem: EcosystemItem[];
  features: FeatureBlock[];
  hardware: HardwareSection;
  products: ProductItem[];
  pricing: PricingTier[];
  contact: ContactContent;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum Section {
  HOME = 'home',
  ECOSYSTEM = 'ecosystem',
  FEATURES = 'features',
  HARDWARE = 'hardware',
  PRICING = 'pricing',
  CONTACT = 'contact',
}

export interface Artist {
  name: string;
  image: string;
  day: string;
  genre: string;
}
