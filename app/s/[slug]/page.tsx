import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Props {
    params: { slug: string }
}

export default async function ClonedSitePage({ params }: Props) {
    const site = await prisma.cloned_sites.findFirst({
        where: { slug: params.slug },
        include: {
            cloned_site_settings: true // Configs extras como pixel
        }
    })

    if (!site) notFound()

    // Scripts personalizados podem ser injetados aqui
    // const customScripts = site.cloned_site_settings?.custom_head_scripts || ''

    return (
        <>
            <div dangerouslySetInnerHTML={{ __html: site.edited_html || site.original_html }} />
        </>
    )
}
