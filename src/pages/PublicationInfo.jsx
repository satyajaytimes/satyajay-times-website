import { publicationPages, publicationContact } from '../../publication-info.mjs';
import ManagedMeta from '../components/ManagedMeta';
import { SITE_ORIGIN } from '../lib/siteMeta';

export default function PublicationInfo({ pathname }) {
  const page = publicationPages[pathname];
  return <>
    <ManagedMeta>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <link rel="canonical" href={SITE_ORIGIN + pathname} />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={SITE_ORIGIN + pathname} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={SITE_ORIGIN + '/favicon-512.png'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
      <meta name="twitter:image" content={SITE_ORIGIN + '/favicon-512.png'} />
    </ManagedMeta>
    <section className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
      <article className="card"><div>
        <h1>{page.heading}</h1>
        {page.sections.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}
        <h2>सार्वजनिक संपर्क</h2>
        <p><a href={publicationContact.phoneHref}>{publicationContact.phone}</a></p>
        <p><a href={'mailto:' + publicationContact.email}>{publicationContact.email}</a></p>
        <p>{publicationContact.address}</p>
      </div></article>
    </section>
  </>;
}
