import { lightbox } from 'wix-window';

export function captcha1_verified() {
	lightbox.close({"verified": true});
}