<?php

namespace App\Support;

/**
 * Starting text for the FAQ and legal pages. The admin can edit all of it under
 * Pages, and the tokens {store_name}, {store_email}, {store_phone} and
 * {store_address} are filled in from Store Settings when a page is shown.
 *
 * This is a sensible starting draft, not legal advice: have it reviewed for the business.
 */
class LegalPageDefaults
{
    public const UPDATED_ON = 'September 26, 2026';

    /**
     * @return array<string, mixed>
     */
    public static function faq(): array
    {
        return [
            'title' => 'Frequently Asked Questions',
            'intro' => 'Quick answers about ordering, delivery, payments and more. Cannot find what you need? Contact us and we will be happy to help.',
            'items' => [
                [
                    'question' => 'How do I place an order?',
                    'answer' => 'Browse the menu, add your dishes to the cart and go to checkout. Choose store pickup or delivery, pick a date and time, and pay online or on pickup or delivery. You will get a confirmation email straight away.',
                ],
                [
                    'question' => 'Do I need an account to order?',
                    'answer' => 'No, you can check out as a guest. An account lets you track past orders, reorder in one click, earn loyalty points and set up repeat orders. If you order as a guest and later create an account with the same email, your past orders and bookings appear once you verify your email.',
                ],
                [
                    'question' => 'Where do you deliver, and what does delivery cost?',
                    'answer' => 'We deliver to areas in and around Windsor. Enter your address at checkout and we will show the delivery fee for your area. If your address is outside our delivery zones, you can still choose store pickup or contact us to see what we can arrange.',
                ],
                [
                    'question' => 'How does pickup work?',
                    'answer' => 'Choose a pickup date and time at checkout. We will email you when your order is ready. Collect it at {store_address} and bring your order number.',
                ],
                [
                    'question' => 'How long will my order take?',
                    'answer' => 'Everything is cooked fresh, so most orders are ready within about two hours. You choose the date and time at checkout, and larger or catering orders may need more notice.',
                ],
                [
                    'question' => 'What payment methods do you accept?',
                    'answer' => 'You can pay online by card through our secure payment partner, or pay when you pick up or receive your order. We never see or store your card details.',
                ],
                [
                    'question' => 'Can I change or cancel my order?',
                    'answer' => 'Contact us as soon as possible. If the kitchen has not started on your order we can usually change or cancel it. Please see our Refund Policy for details.',
                ],
                [
                    'question' => 'How do I track my order?',
                    'answer' => 'Your confirmation email has a Track your order link. It shows each step from received to ready, and we email you at the main steps along the way. Logged-in customers can also open any order from their dashboard.',
                ],
                [
                    'question' => 'I have a food allergy. Can you help?',
                    'answer' => 'Please tell us about any allergy in the notes at checkout or call us before ordering. Our kitchen handles common allergens such as nuts, dairy, gluten, fish, shellfish, soy and sesame, so we cannot guarantee any dish is completely allergen-free.',
                ],
                [
                    'question' => 'How do coupon codes work?',
                    'answer' => 'Enter your code in the coupon box at checkout and press Apply. Codes can have a minimum order, an expiry date or a limit on uses, and each code comes with its own rules. Subscribe to our newsletter to get a welcome offer for your first order.',
                ],
                [
                    'question' => 'How do loyalty points work?',
                    'answer' => 'Signed-in customers earn points on every order once it is complete, and can use them for a discount at checkout. Your balance and the current rules are in your account under My Points.',
                ],
                [
                    'question' => 'Can I set up a repeat order?',
                    'answer' => 'Yes. When you check out with a verified account, tick Repeat this order and choose weekly or every two weeks. Repeat orders are paid on pickup or delivery. We email you before each one, and you can skip, pause or cancel any time from your account.',
                ],
                [
                    'question' => 'Do you cater for events?',
                    'answer' => 'Yes. Use the Bookings page and choose Catering or Private Event, or contact us with your date, guest count and any dietary needs, and we will put together a quote.',
                ],
                [
                    'question' => 'How do I book a table?',
                    'answer' => 'Go to the Bookings page, choose Dine In, and send your request. We will email you to confirm your booking.',
                ],
                [
                    'question' => 'Something was wrong with my order. What do I do?',
                    'answer' => 'We are sorry about that. Contact us within 24 hours, tell us what happened and include a photo if you can. Our Refund Policy explains what we will do to put it right.',
                ],
                [
                    'question' => 'How do I contact you?',
                    'answer' => 'Email {store_email} or call {store_phone}. You can also use the form on our Contact page.',
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function privacy(): array
    {
        return [
            'title' => 'Privacy Policy',
            'updated_on' => self::UPDATED_ON,
            'body' => <<<'HTML'
<p>{store_name} ("we", "us") respects your privacy. This policy explains what personal information we collect through our website, why we collect it, and the choices you have. We handle personal information in line with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).</p>

<h2>Information we collect</h2>
<ul>
<li><strong>Contact details</strong> such as your name, email address, phone number and delivery address when you place an order, make a booking, contact us or create an account.</li>
<li><strong>Order and booking details</strong> such as the dishes you ordered, dates, times, notes and payment status.</li>
<li><strong>Account information</strong> such as your login email, a securely stored (hashed) password, your order history and loyalty points.</li>
<li><strong>Messages</strong> you send us through forms or email.</li>
<li><strong>Technical information</strong> such as your browser type and IP address, used for security and to prevent spam.</li>
</ul>
<p>Card payments are handled by our payment partner, Stripe. We never see or store your full card number.</p>

<h2>How we use your information</h2>
<ul>
<li>To prepare, deliver and confirm your orders and bookings, and to keep you updated about them.</li>
<li>To run your account, including loyalty points and repeat orders.</li>
<li>To reply to your questions.</li>
<li>To send you offers and news, only if you subscribed to our newsletter or you are a past customer, and always with a way to unsubscribe.</li>
<li>To keep the site secure, prevent fraud and spam, and meet legal obligations.</li>
</ul>

<h2>Cookies and similar storage</h2>
<p>We use your browser's storage to remember your cart, your sign-in session, and whether you have seen our welcome offer. We use Google reCAPTCHA on forms to block automated abuse, which may collect technical information about your device as described in Google's privacy policy.</p>

<h2>Who we share it with</h2>
<p>We do not sell your personal information. We share it only with service providers who help us run the business, and only what they need: payment processing (Stripe), email delivery, website hosting and security tools. We may also disclose information when the law requires it.</p>

<h2>Marketing emails</h2>
<p>We send promotional emails only with your consent, which you give by subscribing or, for past customers, through your recent purchase. Every promotional email has an unsubscribe link. Order and booking emails are about your transactions and will continue.</p>

<h2>How long we keep it</h2>
<p>We keep order and booking records as long as needed for accounting, tax and legal purposes, and keep account information until you ask us to delete it.</p>

<h2>Keeping it safe</h2>
<p>We use reasonable safeguards, including encrypted connections and hashed passwords, to protect your information. No online service can be completely secure, so please use a strong, unique password.</p>

<h2>Your choices and rights</h2>
<p>You can ask to see the personal information we hold about you, correct it, withdraw your consent to marketing, or ask us to delete your account. Email {store_email} and we will respond promptly.</p>

<h2>Children</h2>
<p>Our website is not aimed at children under 13, and we do not knowingly collect their information.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>

<h2>Contact us</h2>
<p>Questions about privacy? Email {store_email}, call {store_phone}, or write to {store_name}, {store_address}.</p>
HTML,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function terms(): array
    {
        return [
            'title' => 'Terms & Conditions',
            'updated_on' => self::UPDATED_ON,
            'body' => <<<'HTML'
<p>Welcome to {store_name}. By using our website, placing an order or making a booking, you agree to these terms. Please read them, and contact us if anything is unclear.</p>

<h2>Using our website</h2>
<p>You agree to use the site lawfully and honestly, to give accurate information, and not to misuse it, for example by attempting to disrupt it, place false orders or access other people's accounts.</p>

<h2>Your account</h2>
<p>You are responsible for keeping your password safe and for activity on your account. You must verify your email address to use account features. Tell us right away if you think someone else has used your account.</p>

<h2>Orders</h2>
<ul>
<li>All prices are in Canadian dollars (CAD). Taxes and any delivery fee are shown at checkout before you pay.</li>
<li>An order is accepted when we send you a confirmation email. We may decline or cancel an order, for example if an item is unavailable, a price was shown incorrectly or we cannot deliver to your address. If we cancel a paid order, we will refund it in full.</li>
<li>Menu items, prices and availability can change without notice.</li>
<li>Photos are for illustration and the finished dish may look slightly different.</li>
</ul>

<h2>Pickup and delivery</h2>
<p>Times you choose at checkout are targets, and we will do our best to meet them. Please be available at the address or the store at the chosen time. Delivery is available only within our delivery areas, and delivery fees are set by area. If nobody can receive a delivery, we may not be able to redeliver or refund it.</p>

<h2>Payment</h2>
<p>You can pay online by card through Stripe or, where offered, on pickup or delivery. Repeat orders are paid on pickup or delivery. By paying online you also agree to Stripe's terms.</p>

<h2>Allergies and dietary needs</h2>
<p>Our kitchen handles common allergens, so we cannot guarantee any dish is free of them. Please tell us about allergies before you order and use your own judgment. We cannot accept responsibility for reactions where an allergy was not disclosed.</p>

<h2>Coupons, loyalty points and repeat orders</h2>
<ul>
<li>Coupon codes follow the rules shown with them (such as expiry, minimum order and limits on use) and cannot be exchanged for cash.</li>
<li>Loyalty points have no cash value, may expire as shown in your account, and can be changed or ended by us with reasonable notice. Points earned on an order that is cancelled or refunded are removed.</li>
<li>You can skip, pause or cancel a repeat order at any time before the kitchen starts on it.</li>
</ul>

<h2>Bookings and catering</h2>
<p>A booking request is confirmed only when we email you. For catering and private events, prices and terms are agreed with you directly and may differ from these terms.</p>

<h2>Reviews and messages</h2>
<p>If you post a review, you confirm it is honest and based on your own experience. We may remove content that is offensive, unlawful or spam.</p>

<h2>Our content</h2>
<p>The text, images, logo and design on this site belong to {store_name} or its licensors. You may not copy or reuse them for commercial purposes without our written permission.</p>

<h2>Limits of our responsibility</h2>
<p>We work hard to keep the site accurate and available, but we provide it "as is". To the fullest extent the law allows, we are not liable for indirect or consequential losses, and our total liability for any order is limited to the amount you paid for it. Nothing in these terms limits rights you have under Canadian consumer protection law.</p>

<h2>Changes</h2>
<p>We may update these terms. The date at the top shows the latest version, and using the site after a change means you accept it.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of Ontario and the federal laws of Canada that apply there.</p>

<h2>Contact us</h2>
<p>Questions? Email {store_email} or call {store_phone}.</p>
HTML,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function refund(): array
    {
        return [
            'title' => 'Refund Policy',
            'updated_on' => self::UPDATED_ON,
            'body' => <<<'HTML'
<p>We want you to love your food. If something is not right, this policy explains how we will make it right. Fresh food cannot be returned, so we handle problems with refunds, credits or remakes instead.</p>

<h2>Cancelling an order</h2>
<ul>
<li><strong>Before we start cooking:</strong> you can cancel for a full refund. Contact us as soon as possible, or skip a repeat order from your account.</li>
<li><strong>After the kitchen has started:</strong> we usually cannot cancel because the food is already being prepared, but tell us and we will see what we can do.</li>
<li><strong>If we cancel:</strong> if we cannot fulfil your order for any reason, you will get a full refund.</li>
</ul>

<h2>Problems with your order</h2>
<p>Please contact us within <strong>24 hours</strong> of receiving your order if:</p>
<ul>
<li>an item is missing or incorrect,</li>
<li>the food arrived spoiled, cold or was not prepared as ordered, or</li>
<li>your order was damaged or spilled in delivery.</li>
</ul>
<p>Tell us what happened and, if you can, include a photo. Depending on the problem we will remake the item, refund the affected item or refund the whole order. We do not refund for a change of mind after the food has been prepared, or for taste preference alone, though please tell us so we can improve.</p>

<h2>Late or missed delivery</h2>
<p>If your delivery is significantly late or does not arrive, contact us right away. We will look into it and, where the delay is our fault, refund the delivery fee or the order as appropriate. If a delivery could not be completed because nobody could receive it, we may not be able to offer a refund.</p>

<h2>How refunds are paid</h2>
<ul>
<li><strong>Paid online by card:</strong> refunded to the original card. Most banks show it within 5 to 10 business days.</li>
<li><strong>Paid on pickup or delivery:</strong> we correct the amount at the time, or refund you by e-transfer or store credit if you already paid.</li>
</ul>

<h2>Coupons and loyalty points</h2>
<p>If an order is refunded or cancelled, points you earned on it are removed and points you used are returned to your account. A coupon used on a cancelled order may be restored if it is still valid.</p>

<h2>Bookings, catering and events</h2>
<p>Table bookings can be cancelled free of charge; please let us know as early as you can. Catering and private events are agreed individually, so their cancellation and refund terms are confirmed in writing when you book.</p>

<h2>How to reach us</h2>
<p>Email {store_email} or call {store_phone} with your order number. We will reply as quickly as we can.</p>
HTML,
        ];
    }
}
