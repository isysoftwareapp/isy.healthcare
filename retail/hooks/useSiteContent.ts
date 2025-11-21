
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect } from 'react';
import { SiteContent, EcosystemItem, FeatureBlock, ProductItem } from '../types';

const DEFAULT_CONTENT: SiteContent = {
  images: {
    logo: null, // null means use default text logo
    heroDashboard: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    backgroundImage: null
  },
  hero: {
    badge: "Next Gen Retail Management",
    titleLine1: "One platform.",
    titleLine2: "Total control.",
    subtitle: "An integrated solution for complete management of customers, memberships, cashback, inventory, suppliers, staff, and payments."
  },
  ecosystem: [
    { 
      id: 'eco-1',
      icon: 'Monitor', 
      title: 'KIOSK', 
      description: 'Self-service terminal for browsing, buying, and payments.',
      bgClass: 'bg-[#ADE8F4]/30'
    },
    { 
      id: 'eco-2',
      icon: 'Settings', 
      title: 'ADMIN PANEL', 
      description: 'Management of customers, products, stock, cashback, staff, and analytics.',
      bgClass: 'bg-gray-50'
    },
    { 
      id: 'eco-3',
      icon: 'CreditCard', 
      title: 'MEMBER CARD', 
      description: 'Unique QR membership card for access and exclusive benefits.',
      bgClass: 'bg-gradient-to-br from-[#498FB3] to-[#2c5d75]'
    }
  ],
  features: [
    {
      id: 'feat-1',
      tagline: "Customer Experience",
      title: "Simple, modern, intuitive.",
      description: "The Kiosk is the heart of the digital retail experience. It allows customers to browse, customize, and purchase products easily and securely.",
      bullets: [
        'Two access modes: Member & Non-Member',
        'Full-touch multilingual interface',
        'Automated Points & Cashback'
      ],
      image: "", // Uses custom UI
      layout: 'left',
      visualType: 'custom_kiosk_ui'
    },
    {
      id: 'feat-2',
      tagline: "UNIQUE FEATURE",
      title: "Create your own personalized joint.",
      description: "A unique kiosk feature that lets customers design their joint from scratch with a real-time interactive 3D preview.",
      bullets: [], // This section uses custom cards in the design instead of bullets
      image: "https://images.unsplash.com/photo-1635329235219-e63f8652340f?q=80&w=2000&auto=format&fit=crop",
      layout: 'right',
      visualType: 'custom_joint_ui'
    },
    {
      id: 'feat-3',
      tagline: "Back Office",
      title: "Real-time management.",
      description: "The Admin Panel is the core command center. Manage products, pricing, customers, stock, and staff from anywhere via the cloud.",
      bullets: [
        'Product and pricing configuration',
        'Customer and membership management',
        'Real-time stock and sales monitoring',
        'Data analytics and detailed reporting'
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2370&auto=format&fit=crop",
      layout: 'left',
      visualType: 'image'
    }
  ],
  hardware: {
    title: "Complete Hardware Ecosystem",
    subtitle: "Our solution includes everything needed for a fully functional, branded setup. From custom cards to high-speed printers.",
    items: [
       {
        title: "POS System",
        description: "All-in-one terminals for staff management and rapid checkout.",
        icon: "Monitor"
      },
      {
        title: "Kiosk Stations",
        description: "Self-service touchpoints available in floor-standing or desktop models.",
        icon: "Smartphone"
      },
      {
        title: "Membership Cards",
        description: "PVC, Wood, or Recycled materials. Laser-engraved with unique QR codes directly linked to member profiles.",
        icon: "QrCode"
      },
      {
        title: "Printing & Scanning",
        description: "Integrated receipt printers and barcode scanners for seamless checkout experiences.",
        icon: "Printer"
      }
    ]
  },
  products: [
    // 5 Kiosks
    {
        id: 'p-k1',
        category: 'kiosk',
        name: 'ISY Slim Floor K1',
        description: 'Elegant, ultra-slim floor standing kiosk perfect for minimalist spaces.',
        image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2000&auto=format&fit=crop',
        specs: ['24" FHD Touchscreen', 'Integrated QR Scanner', 'Thermal Printer (80mm)', 'Wi-Fi 6 & Ethernet'],
        pricePurchase: '45.000',
        priceRent: '2.500'
    },
    {
        id: 'p-k2',
        category: 'kiosk',
        name: 'ISY Countertop C2',
        description: 'Compact desktop solution. Full power, half the footprint.',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=2000&auto=format&fit=crop',
        specs: ['15.6" Touch Display', 'Built-in NFC/RFID', 'Silent Cooling', 'Aluminium Body'],
        pricePurchase: '32.000',
        priceRent: '1.800'
    },
    {
        id: 'p-k3',
        category: 'kiosk',
        name: 'ISY Pro Stand XL',
        description: 'Large format display for maximum visual impact and menu browsing.',
        image: 'https://images.unsplash.com/photo-1601933470096-0e34634ffcde?q=80&w=2000&auto=format&fit=crop',
        specs: ['32" 4K Portrait Mode', 'Dual Speaker System', 'Card Reader Mount', 'Anti-Glare Coating'],
        pricePurchase: '65.000',
        priceRent: '3.200'
    },
    {
        id: 'p-k4',
        category: 'kiosk',
        name: 'ISY Wall Mount W1',
        description: 'Space-saving wall unit. Ideal for high-traffic corridors.',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop',
        specs: ['21.5" Touchscreen', 'VESA Compatible', 'PoE Support', 'Tempered Glass Front'],
        pricePurchase: '38.000',
        priceRent: '2.000'
    },
    {
        id: 'p-k5',
        category: 'kiosk',
        name: 'ISY Outdoor Rugged',
        description: 'Weather-resistant kiosk for outdoor lines and events.',
        image: 'https://images.unsplash.com/photo-1461301214746-1e790926d323?q=80&w=2000&auto=format&fit=crop',
        specs: ['High Brightness (1500 nits)', 'IP65 Water Resistant', 'Vandal Proof', 'Climate Control'],
        pricePurchase: '85.000',
        priceRent: '4.500'
    },
    // 3 POS
    {
        id: 'p-p1',
        category: 'pos',
        name: 'ISY Staff Terminal S1',
        description: 'Dual-screen POS system for cashier efficiency and customer transparency.',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2000&auto=format&fit=crop',
        specs: ['15" Staff Screen + 10" Customer Screen', 'Integrated Receipt Printer', 'Cash Drawer Connection', 'Intel i5 Processor'],
        pricePurchase: '28.000',
        priceRent: '1.500'
    },
    {
        id: 'p-p2',
        category: 'pos',
        name: 'ISY Flex Tablet',
        description: 'Mobile POS tablet for staff to serve customers anywhere in the store.',
        image: 'https://images.unsplash.com/photo-1585444744724-78d673764217?q=80&w=2000&auto=format&fit=crop',
        specs: ['11" Pro Tablet', 'Rugged Case & Strap', 'Long-life Battery (12h)', 'Integrated Card Reader'],
        pricePurchase: '18.000',
        priceRent: '900'
    },
    {
        id: 'p-p3',
        category: 'pos',
        name: 'ISY All-In-One Mini',
        description: 'The perfect starter POS for small dispensaries or pop-up shops.',
        image: 'https://images.unsplash.com/photo-1529101091760-6149d4c46b29?q=80&w=2000&auto=format&fit=crop',
        specs: ['10" Touchscreen', 'Built-in Printer', 'Battery Backup', '4G Connectivity'],
        pricePurchase: '15.000',
        priceRent: '800'
    }
  ],
  contact: {
    email: "info@isy.software",
    phone: "+62 8133929976"
  },
  pricing: [
    {
      name: 'POS System',
      price: '1.000',
      period: '/month',
      description: 'A simple, flexible, and professional management tool for your daily operations.',
      features: [
        'POS license (1 location)',
        'Sales management & Staff control',
        'Stock and supplier monitoring',
        'Loyalty points & customer database',
        'Reports & analytics'
      ]
    },
    {
      name: 'KIOSK System',
      price: '2.000',
      period: '/month',
      description: 'Bring innovation to your store with a smart, self-service customer experience.',
      features: [
        'Kiosk license (1 device)',
        'Interactive customer interface',
        'Cashback & membership engine',
        '3D product visualization',
        'Custom joint creator'
      ],
      highlight: true
    },
    {
      name: 'Full Package',
      price: '3.000',
      period: '/month',
      description: 'One ecosystem, full control. Combine self-service sales and back-office control.',
      features: [
        '1 Kiosk license (with setup)',
        '1 POS license (with dashboard)',
        'Integrated Admin Panel',
        'Unified product & stock management',
        'Real-time control'
      ]
    }
  ]
};

export const useSiteContent = () => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedContent = localStorage.getItem('isy_site_content');
    if (savedContent) {
      try {
        // Merge with default to ensure new fields exist if we update structure
        const parsed = JSON.parse(savedContent);
        // We must ensure 'products' exists if loading from old local storage
        const merged = {
             ...DEFAULT_CONTENT,
             ...parsed,
             images: { ...DEFAULT_CONTENT.images, ...parsed.images }, // Ensure backgroundImage field exists
             products: parsed.products || DEFAULT_CONTENT.products,
             hardware: parsed.hardware || DEFAULT_CONTENT.hardware 
        };
        setContent(merged);
      } catch (e) {
        console.error("Failed to parse saved content", e);
        setContent(DEFAULT_CONTENT);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateContent = (newContent: SiteContent) => {
    setContent(newContent);
    localStorage.setItem('isy_site_content', JSON.stringify(newContent));
  };

  const resetContent = () => {
    setContent(DEFAULT_CONTENT);
    localStorage.setItem('isy_site_content', JSON.stringify(DEFAULT_CONTENT));
  };

  return { content, updateContent, resetContent, isLoaded };
};
