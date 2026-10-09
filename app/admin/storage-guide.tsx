import { SITE_LIMITS, fileSize } from "../../lib/limits.ts";

export default function StorageGuide({ used, files, catalogs, gallery }: { used: number; files: number; catalogs: number; gallery: number }) {
  const remaining = Math.max(0, SITE_LIMITS.uploadStopBytes - used), stopped = remaining === 0;
  return <section className={stopped ? "storage-guide stopped" : "storage-guide"} aria-label="Espacio y límites de tu web">
    <div className="storage-guide-heading"><div><p className="eyebrow">TU ESPACIO, A LA VISTA</p><h3>{fileSize(used)} usados <span>de 250 MB</span></h3></div><strong>{fileSize(remaining)} disponibles para subir</strong></div>
    <div className="storage-meter" role="meter" aria-label="Almacenamiento utilizado" aria-valuemin={0} aria-valuemax={SITE_LIMITS.storageBytes} aria-valuenow={Math.min(used, SITE_LIMITS.storageBytes)}><span style={{ width: `${Math.min(100, used / SITE_LIMITS.storageBytes * 100)}%` }} /><i title="Tope de subidas: 225 MB" /></div>
    <p className="storage-summary">{stopped ? "Llegaste al tope preventivo. Libera archivos sin uso para subir más o crear otro catálogo. Puedes seguir editando y borrando." : "Las nuevas subidas se bloquean antes de superar 225 MB. Los 25 MB restantes quedan como margen preventivo."}</p>
    <div className="storage-counts"><span>Catálogos: <strong>{catalogs} / 60</strong></span><span>Galería: <strong>{gallery} / 150</strong></span><span>Archivos: <strong>{files} / 300</strong></span></div>
    <details><summary>Cómo subir más contenido y cuidar tu espacio</summary><ol>
      <li>Fotos JPG, PNG o WebP: máximo <strong>8 MB por archivo</strong>.</li>
      <li>Clips MP4 o WebM: máximo <strong>60 segundos y 20 MB por archivo</strong>. Para buena calidad y menor peso, exporta a 720p.</li>
      <li>Los videos largos pueden enlazarse desde YouTube o Shorts. Ese enlace no guarda el video aquí.</li>
      <li>Los borradores, fotos de catálogo, portadas y vistas previas de video también ocupan espacio.</li>
      <li>Para liberar espacio, retira la foto o el video de donde se usa, guarda los cambios y elimínalo desde Archivos. Ocultarlo o quitarlo de la galería no elimina el archivo.</li>
      <li>En Catálogos y precios puedes crear un personaje, un combo o un show, con nombre, foto y precio propio. El número de personajes no fija el precio automáticamente.</li>
    </ol><p className="storage-platform-note">Estos son límites preventivos de esta web. El alojamiento está sujeto a los límites del plan de ChatGPT, compartidos con tus otros Sites. Este panel no contrata planes ni aumenta el cupo automáticamente.</p></details>
  </section>;
}
