import { PrismaClient, Role, MembershipStatus, MediaType, MatchType } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
    // Settings
    await prisma.siteSetting.upsert({
        where: { id: "global" },
        update: {},
        create: {
            id: "global",
            clubName: "Your Club Name",
            tagline: "The Pride. The Community. The Future.",
            foundedYear: 2016,
            email: "info@yourclub.com",
            phone: "+254 700 000 000",
            stadium: "Your Stadium",
            address: "Your City • Kenya",
            membershipUrl: "/membership",
            ticketsUrl: "/tickets",
            shopUrl: "/shop",
            partnerName: "Official Partner",
            heroTitle: "Club celebrates 10 Years",
            heroSubtitle: "A decade of passion, pride & football excellence — thank you, family!"
        }
    });
    // Admin user
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.upsert({
        where: { email: "admin@club.local" },
        update: {},
        create: {
            email: "admin@club.local",
            passwordHash,
            name: "Club Admin",
            role: Role.CLUB_ADMIN,
            membership: MembershipStatus.ACTIVE,
            membershipUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000)
        }
    });
    // Sponsors (placeholders)
    const sponsorLogo = await prisma.mediaAsset.create({
        data: { type: MediaType.IMAGE, title: "Sponsor Logo", path: "sponsors/sample-logo.png", mimeType: "image/png" }
    });
    await prisma.sponsor.createMany({
        data: [
            { name: "Official Partner", tier: "Official Partner", logoId: sponsorLogo.id, sort: 1, isActive: true }
        ]
    });
    // Social links
    await prisma.socialLink.createMany({
        data: [
            { platform: "Facebook", url: "https://facebook.com", sort: 1, isActive: true },
            { platform: "Instagram", url: "https://instagram.com", sort: 2, isActive: true },
            { platform: "X", url: "https://x.com", sort: 3, isActive: true },
            { platform: "YouTube", url: "https://youtube.com", sort: 4, isActive: true }
        ]
    });
    // Highlights sample (video block)
    const hlThumb = await prisma.mediaAsset.create({
        data: { type: MediaType.IMAGE, title: "Highlight Thumb", path: "highlights/sample-thumb.jpg", mimeType: "image/jpeg" }
    });
    await prisma.highlight.deleteMany({});
    await prisma.highlight.createMany({
        data: [
            {
                title: "Season Highlights — Road to Glory",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                durationSec: 331,
                publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
                thumbnailId: hlThumb.id,
                sort: 1,
                isActive: true
            }
        ]
    });
    // News sample
    const hero = await prisma.mediaAsset.create({
        data: { type: MediaType.IMAGE, title: "News Hero", path: "news/sample-hero.jpg", mimeType: "image/jpeg" }
    });
    await prisma.newsPost.upsert({
        where: { slug: "welcome-to-our-new-home" },
        update: {},
        create: {
            slug: "welcome-to-our-new-home",
            title: "Welcome to our new official website",
            excerpt: "News, fixtures, squad, tickets and members-only shop—everything in one place.",
            contentHtml: "<p>This is a seeded article. Replace with your real content from the media team.</p>",
            publishedAt: new Date(),
            isFeatured: true,
            heroMediaId: hero.id
        }
    });
    // Matches sample
    const kickoff = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const match = await prisma.match.create({
        data: {
            competition: "Premier League",
            matchType: MatchType.LEAGUE,
            season: "2025/26",
            kickoffAt: kickoff,
            venue: "Your Stadium",
            isHome: true,
            opponent: "Rivals FC",
            status: "SCHEDULED"
        }
    });
    // Ticket event sample
    await prisma.ticketEvent.create({
        data: {
            matchId: match.id,
            title: "Match Tickets",
            salesOpenAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
            salesCloseAt: new Date(Date.now() + 6 * 24 * 3600 * 1000),
            tiers: {
                create: [
                    { name: "VIP", price: 1000, capacity: 200 },
                    { name: "Regular", price: 300, capacity: 2000 }
                ]
            }
        }
    });
    // Team sample
    const portrait = await prisma.mediaAsset.create({
        data: { type: MediaType.IMAGE, title: "Player Portrait", path: "team/sample-player.png", mimeType: "image/png" }
    });
    await prisma.teamMember.upsert({
        where: { slug: "sample-player" },
        update: {},
        create: {
            slug: "sample-player",
            fullName: "Sample Player",
            jerseyNo: "10",
            position: "ST",
            team: "Men's First Team",
            funFact: "Loves late winners.",
            bioHtml: "<p>Short bio.</p>",
            portraitId: portrait.id,
            isStaff: false
        }
    });
    // Shop sample product
    const productHero = await prisma.mediaAsset.create({
        data: { type: MediaType.IMAGE, title: "Home Jersey", path: "shop/home-jersey.jpg", mimeType: "image/jpeg" }
    });
    await prisma.product.upsert({
        where: { slug: "home-jersey" },
        update: {},
        create: {
            slug: "home-jersey",
            title: "Home Jersey",
            description: "<p>Replica jersey (seed).</p>",
            category: "KIT",
            kitType: "HOME",
            price: 2000,
            heroMediaId: productHero.id,
            isActive: true
        }
    });
    // FAQ sample
    await prisma.fAQ.createMany({
        data: [
            { question: "How do I become a member?", answerHtml: "<p>Register an account and purchase membership.</p>", sort: 1 },
            { question: "Do I need membership to shop?", answerHtml: "<p>Yes—members-only shop access is enforced.</p>", sort: 2 }
        ],
        skipDuplicates: true
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
