// Applies the stored theme before first paint.
//
// Running this as a blocking inline script in <head> is what stops the
// light palette flashing on a dark-theme reload: by the time the body is
// painted, the `.dark` class is already on <html>.
const SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
