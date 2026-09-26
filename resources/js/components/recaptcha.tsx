import { usePage } from '@inertiajs/react';
import { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

type RecaptchaProps = {
    onChange: (token: string) => void;
    error?: string;
    className?: string;
};

/**
 * Google reCAPTCHA v2 checkbox. Renders nothing when no site key is
 * configured (the server skips verification in that case too).
 */
const Recaptcha = forwardRef<ReCAPTCHA, RecaptchaProps>(function Recaptcha({ onChange, error, className }, ref) {
    const siteKey = usePage<{ recaptchaSiteKey?: string | null }>().props.recaptchaSiteKey;

    if (!siteKey) {
        return null;
    }

    return (
        <div className={className}>
            <ReCAPTCHA ref={ref} sitekey={siteKey} onChange={(token) => onChange(token ?? '')} onExpired={() => onChange('')} />
            {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
        </div>
    );
});

export default Recaptcha;
