import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    await db.schoolGroup.createMany({
        data: [
            { name: "Compétences & Développement" },
            { name: "GROUPE IGENSIA" },
        ],
    });

    const cdGroup = await db.schoolGroup.findUnique({ where: { name: "Compétences & Développement" } });
    const igGroup = await db.schoolGroup.findUnique({ where: { name: "GROUPE IGENSIA" } });

    if (!cdGroup || !igGroup) throw new Error("Unable to retrieve the school groups");

    const schools = [

        // Compétences & Développement
        { logo: "/schools/3a.png", name: "3A", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/epsi.png", name: "EPSI", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/esail.png", name: "ESAIL", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/icl.png", name: "ICL", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/idrac_business_school.png", name: "IDRAC Business School", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/ieft.png", name: "IEFT", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/iet.png", name: "IET", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/ifag.png", name: "IFAG", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/igefi.png", name: "IGEFI", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/ihedrea.png", name: "IHEDREA", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/ileri.png", name: "ILERI", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/sup_de_com.png", name: "SUP' DE COM", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/viva_mundi.png", name: "VIVA MUNDI", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },
        { logo: "/schools/wis.png", name: "WIS", loginServer: "https://cas-p.wigorservices.net/cas/login", scheduleServer: "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx", groupId: cdGroup.id },

        // IGENSIA
        { logo: "/schools/american_business_college.png", name: "American Business College", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/esam.png", name: "ESAM", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/icd_business_school.png", name: "ICD BUSINESS SCHOOL", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/igensia_rh.png", name: "IGENSIA RH", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/imis.png", name: "IMIS", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/imsi.png", name: "IMSI", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/ipi.png", name: "IPI", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/iscpa.png", name: "ISCPA", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/ismm.png", name: "ISMM", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/cnva.png", name: "CNVA", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/business_science_institute.png", name: "Business Science Institute", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/ecm.png", name: "ECM", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/emi.png", name: "EMI", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
        { logo: "/schools/esa.png", name: "ESA", loginServer: "https://moncampus.igensia-education.fr", scheduleServer: "https://ws-edt-igs.wigorservices.net", groupId: igGroup.id },
    ];

    await db.school.createMany({
        data: schools,
    });

}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await db.$disconnect();
    });