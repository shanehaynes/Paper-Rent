import './styles.css';
import { live } from './live.js';
import { buildPrint } from './print.js';

// ?print renders the static slide deck for PDF export; everything else is the live presentation.
if (new URLSearchParams(location.search).has('print')) buildPrint();
else live();
