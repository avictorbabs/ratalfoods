<?php

namespace App\Support;

class PageContentDefaults
{
    /**
     * @return list<string>
     */
    public static function slugs(): array
    {
        return ['home', 'about', 'contact', 'booking', 'menu', 'gallery', 'footer', 'faq', 'privacy', 'terms', 'refund'];
    }

    public static function label(string $slug): string
    {
        return match ($slug) {
            'home' => 'Home',
            'about' => 'About',
            'contact' => 'Contact',
            'booking' => 'Booking',
            'menu' => 'Menu',
            'gallery' => 'Gallery',
            'footer' => 'Footer',
            'faq' => 'FAQ',
            'privacy' => 'Privacy Policy',
            'terms' => 'Terms & Conditions',
            'refund' => 'Refund Policy',
            default => ucfirst($slug),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public static function for(string $slug): array
    {
        return match ($slug) {
            'home' => self::home(),
            'about' => self::about(),
            'contact' => self::contact(),
            'booking' => self::booking(),
            'menu' => self::menu(),
            'gallery' => self::gallery(),
            'footer' => self::footer(),
            'faq' => LegalPageDefaults::faq(),
            'privacy' => LegalPageDefaults::privacy(),
            'terms' => LegalPageDefaults::terms(),
            'refund' => LegalPageDefaults::refund(),
            default => [],
        };
    }

    /**
     * Merge stored content over defaults without dropping unknown nested keys from defaults.
     *
     * @param  array<string, mixed>  $defaults
     * @param  array<string, mixed>  $stored
     * @return array<string, mixed>
     */
    public static function merge(array $defaults, array $stored): array
    {
        foreach ($defaults as $key => $value) {
            if (! array_key_exists($key, $stored)) {
                continue;
            }

            if (is_array($value) && is_array($stored[$key]) && ! array_is_list($value)) {
                $defaults[$key] = self::merge($value, $stored[$key]);

                continue;
            }

            $defaults[$key] = $stored[$key];
        }

        return $defaults;
    }

    /**
     * @return array<string, mixed>
     */
    private static function home(): array
    {
        return [
            'hero' => [
                'image' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/ca61fad2b_generated_1f3b0921.png',
                'eyebrow' => 'Windsor, Ontario',
                'title' => 'Food Is Life.',
                'title_line_2' => 'Authentic Nigerian Cuisine, Jollof Rice & More.',
                'body' => 'Authentic Nigerian cuisine crafted with heritage, served with modern flair and certified safety.',
                'cta_primary_label' => 'Explore the Menu',
                'cta_primary_href' => '/menu',
                'cta_secondary_label' => 'Our History',
                'cta_secondary_href' => '/about',
            ],
            'perks' => [
                ['title' => 'Fast Delivery', 'description' => 'Delivery on request'],
                ['title' => 'Get Discount', 'description' => 'On deals'],
                ['title' => '24/7 Customer Care', 'description' => 'Best support'],
                ['title' => 'Money Back Guarantee', 'description' => 'If terms & conditions are met'],
            ],
            'categories' => [
                'eyebrow' => 'Browse the Menu',
                'heading' => 'Shop by Category',
                'link_label' => 'All Category',
            ],
            'featured' => [
                'eyebrow' => 'Curated Selection',
                'heading' => 'Featured Dishes',
                'link_label' => 'View All',
                'mobile_link_label' => 'View Full Menu',
            ],
            'why' => [
                'eyebrow' => 'The Ratal Difference',
                'heading' => 'Why Choose Us',
                'slides' => [
                    [
                        'title' => 'Authentic Nigerian Cuisine in Windsor, ON',
                        'description' => 'At Ratal Foods, we bring the rich flavours of Nigeria right to Windsor, ON, with a delightful twist. Our chefs are trained professionals, combining traditional recipes with modern techniques to serve you the very best of Nigerian dishes.',
                        'image' => '/images/why-choose-us/authentic-cuisine.webp',
                        'image_alt' => 'Authentic Nigerian breakfast plate',
                        'cta_label' => 'Order Now',
                        'cta_href' => '/menu',
                    ],
                    [
                        'title' => 'Explore Our Menu',
                        'description' => 'From spicy suya and egusi soup to ayamase and moimoi, we offer a variety of authentic Nigerian dishes prepared with care and expertise. Every meal is a reflection of our passion for preserving the originality of Nigerian cuisine.',
                        'image' => '/images/why-choose-us/explore-menu.webp',
                        'image_alt' => 'Suya platter with seasoned rice',
                        'cta_label' => 'Order Now',
                        'cta_href' => '/menu',
                    ],
                    [
                        'title' => 'Local & Certified',
                        'description' => 'Proudly serving Windsor and Essex County, we prioritize food safety. Our team holds food safety handler certificates and diplomas in culinary and hospitality management, ensuring you enjoy each dish with confidence.',
                        'image' => '/images/why-choose-us/local-certified.webp',
                        'image_alt' => 'Grilled fish and chicken skewers with rice',
                        'cta_label' => 'Order Now',
                        'cta_href' => '/menu',
                    ],
                ],
            ],
            'cta' => [
                'heading' => 'Taste the Difference',
                'body' => 'Join us for a dining experience that celebrates the unique flavours of Nigeria, all prepared with a professional touch. Reach out to place your order or if you have any questions for us.',
                'primary_label' => 'Order Now',
                'primary_href' => '/menu',
                'secondary_label' => 'Contact Us',
                'secondary_href' => '/contact',
            ],
            'newsletter' => [
                'eyebrow' => 'Stay Connected',
                'heading' => 'Join Our Mailing List',
                'body' => 'Be the first to hear about new dishes and exclusive offers from Ratal Foods.',
                'button_label' => 'Subscribe',
            ],
            'blog' => [
                'eyebrow' => 'From Our Kitchen',
                'heading' => 'Latest Update',
                'link_label' => 'View All',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function about(): array
    {
        return [
            'hero' => [
                'image' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'eyebrow' => 'Our Story',
                'title' => 'About Us',
            ],
            'story' => [
                'image' => '/images/about-us/about1.webp',
                'heading' => 'Bringing Passion for Nigerian Cuisine to Canada',
                'body' => 'Ratal Foods was founded by Augustina, whose culinary journey began in her small kitchen, cooking for intimate gatherings. After running her own establishment for several years, she migrated to Canada in 2017, eager to continue her passion for Nigerian cuisine.',
                'cta_label' => 'Explore Our Menu',
                'cta_href' => '/menu',
            ],
            'history' => [
                [
                    'heading' => 'Building Skills and Experience',
                    'body' => 'Upon arriving in Canada, Augustina enrolled at St. Clair College, where she earned a diploma in Culinary and Art Management. Determined to enhance her skills, she pursued a diploma in Hospitality Management and completed an internship at Walt Disney World, gaining invaluable experience in the industry.',
                ],
                [
                    'heading' => 'The Beginning of Something Special',
                    'body' => 'In 2024, after completing the Cook-Up Incubator Program, Augustina launched Ratal Foods. Their first appearance at the Downtown Windsor Farmers Market was met with overwhelming success, with positive reviews and great sales.',
                ],
            ],
            'culture' => [
                'heading' => 'Celebrating Culture and Community',
                'body' => 'With the Nigerian community in Windsor rapidly expanding, Ratal Foods is proud to serve authentic Nigerian dishes and create an inviting space for all to enjoy true flavors of Nigeria in Ontario.',
                'cta_label' => 'Visit Us Today',
                'cta_href' => '/contact',
                'image' => '/images/about-us/about2.webp',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function contact(): array
    {
        return [
            'hero' => [
                'image' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'eyebrow' => "Let's Connect",
                'title' => 'Contact Us',
            ],
            'intro' => [
                'eyebrow' => 'Get In Touch',
                'heading' => "Let's Talk",
                'body' => "Have questions, special requests, or need a delivery quote? We'd love to hear from you.",
            ],
            'location_label' => 'Location',
            'location' => '499 University Ave W, Windsor, ON N9A 5P8, Canada',
            'phone_label' => 'Phone',
            'phone' => '226-348-7156',
            'email_label' => 'Email',
            'email' => 'augustina@ratalfoods.com',
            'whatsapp_url' => 'https://wa.me/12263487156',
            'whatsapp_label' => 'Message Us on Whatsapp',
            'map_heading' => 'Find Us',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function booking(): array
    {
        return [
            'hero' => [
                'image' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'eyebrow' => 'Reserve Your Experience',
                'title' => 'Make a Booking',
                'body' => "Dine in, host a private event, or arrange catering — we'd love to have you.",
            ],
            'types' => [
                ['value' => 'dine_in', 'label' => 'Dine In', 'description' => 'Reserve a table for your party'],
                ['value' => 'catering', 'label' => 'Catering', 'description' => 'We bring the feast to you'],
                ['value' => 'private_event', 'label' => 'Private Event', 'description' => 'Exclusive hire for special occasions'],
            ],
            'success' => [
                'heading' => 'Booking Received!',
                'confirm_copy' => "We'll confirm your booking within 2 hours.",
                'cta_label' => 'Make Another Booking',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function menu(): array
    {
        return [
            'hero' => [
                'image' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'title' => 'Our Menu',
                'body' => 'Authentic Nigerian dishes, crafted with heritage and served fresh',
            ],
            'details_button_label' => 'Read Menu Details',
            'details' => [
                [
                    'title' => 'Nigerian Classics',
                    'description' => 'Explore a variety of authentic Nigerian dishes, each crafted with care and tradition.',
                    'items' => [
                        ['name' => 'Jollof Rice and Chicken', 'description' => 'A classic West African dish, bursting with flavour.'],
                        ['name' => 'Egusi Soup and Pounded Yam', 'description' => 'A hearty combination of rich, savoury soup with soft, pounded yam.'],
                        ['name' => 'Ofada Rice and Ayamase Sauce', 'description' => 'A traditional meal featuring local rice paired with spicy Ayamase sauce.'],
                    ],
                    'body' => '',
                    'cta_label' => '',
                    'cta_category' => '',
                ],
                [
                    'title' => 'Grilled and Spicy Delights',
                    'description' => 'Indulge in dishes that pack a punch.',
                    'items' => [
                        ['name' => 'Spicy Suya', 'description' => 'Grilled, spicy meat skewers seasoned with a flavourful blend of spices.'],
                        ['name' => 'Moimoi', 'description' => 'A steamed bean pudding made with ground beans, pepper, and spices.'],
                    ],
                    'body' => '',
                    'cta_label' => '',
                    'cta_category' => '',
                ],
                [
                    'title' => 'All-Time Favourites',
                    'description' => 'Enjoy some of our most loved meals, prepared to perfection.',
                    'items' => [
                        ['name' => 'Fried Rice and Chicken', 'description' => 'A delicious and colourful blend of fried rice and tender chicken.'],
                        ['name' => 'Amala and Abula', 'description' => 'A popular dish from Nigeria, perfect for those seeking bold flavours.'],
                    ],
                    'body' => '',
                    'cta_label' => '',
                    'cta_category' => '',
                ],
                [
                    'title' => 'Seasonal Specials',
                    'description' => 'At Ratal Foods, we love to celebrate the seasons with special dishes that highlight the freshest ingredients. Our seasonal specials change regularly, offering a unique dining experience with every visit. Be sure to check back often to discover what new flavours we have in store for you!',
                    'items' => [],
                    'body' => '',
                    'cta_label' => 'See Specials',
                    'cta_category' => 'Seasonal Specials',
                ],
            ],
            'board_left_top' => '/images/menu/menu-board-snacks-specials.png',
            'board_left_bottom' => '/images/menu/menu-board-entrees.png',
            'board_right' => '/images/menu/menu-collage.png',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function gallery(): array
    {
        return [
            'hero' => [
                'image' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'eyebrow' => 'Explore Our Dishes',
                'title' => 'Gallery',
            ],
            'heading' => 'Highlighting Our Culinary Masterpieces',
            'featured' => [
                [
                    'title' => 'Our Ingredients',
                    'description' => 'We believe that the key to great food is great ingredients. That’s why we only use the freshest, highest-quality ingredients in all of our dishes. We source our produce from local farmers whenever possible, and we are committed to using organic and non-GMO ingredients whenever possible. We also make everything from scratch in our kitchen, so you can be sure that your meal is fresh and flavorful.',
                ],
                [
                    'title' => 'Our Sustainability',
                    'description' => 'We believe that good food should be good for the planet, too. That’s why we are committed to sustainability in everything we do. We use eco-friendly packaging materials, recycle and compost as much as possible, and source our ingredients from local and sustainable sources. We are always looking for ways to reduce our environmental impact and make a positive difference in our community.',
                ],
            ],
            'showcase_1' => '/images/gallery1.webp',
            'showcase_2' => '/images/gallery2.webp',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function footer(): array
    {
        return [
            'brand_name' => 'Ratal Foods',
            'logo' => '',
            'tagline' => 'Authentic Nigerian cuisine in Windsor, ON. Crafted with heritage, served with pride.',
            'phone' => '226-348-7156',
            'taste_map_heading' => 'Taste Map',
            'taste_map' => [
                ['label' => 'Nigerian Classics', 'href' => '/menu?category=Nigerian Classics'],
                ['label' => 'All-Time Favourites', 'href' => '/menu?category=All-Time Favourites'],
                ['label' => 'Grilled & Spicy', 'href' => '/menu?category=Grilled & Spicy'],
                ['label' => 'Seasonal Specials', 'href' => '/menu?category=Seasonal Specials'],
                ['label' => 'Sides & Extras', 'href' => '/menu?category=Sides & Extras'],
            ],
            'community_heading' => 'Community Ledger',
            'community' => [
                ['label' => 'Facebook', 'href' => 'https://www.facebook.com/215263468329993'],
                ['label' => 'Instagram', 'href' => 'https://www.instagram.com/ratalfoods'],
                ['label' => 'TikTok', 'href' => 'https://www.tiktok.com/@ratal.foods'],
                ['label' => 'LinkedIn', 'href' => 'https://www.linkedin.com/in/augustina-kadiri-omogbai'],
                ['label' => 'Yelp', 'href' => 'https://www.yelp.com/biz/GN4j-qGUouoNFm_K6ZmKgA'],
            ],
            'legal_heading' => 'Legal Pages',
            'legal' => [
                ['label' => 'FAQ', 'href' => '/faq'],
                ['label' => 'Privacy Policy', 'href' => '/privacy-policy'],
                ['label' => 'Terms & Conditions', 'href' => '/terms-and-conditions'],
                ['label' => 'Refund Policy', 'href' => '/refund-policy'],
            ],
            'copyright' => '© {year} Ratal Foods. All Rights Reserved.',
            'nav' => [
                ['label' => 'Home', 'href' => '/'],
                ['label' => 'Menu', 'href' => '/menu'],
                ['label' => 'About', 'href' => '/about'],
                ['label' => 'Contact', 'href' => '/contact'],
            ],
        ];
    }
}
