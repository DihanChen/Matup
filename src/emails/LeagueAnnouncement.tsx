import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Text,
} from "@react-email/components";

type LeagueAnnouncementProps = {
  hostName: string;
  leagueName: string;
  message: string;
  link: string;
};

export default function LeagueAnnouncement({
  hostName,
  leagueName,
  message,
  link,
}: LeagueAnnouncementProps) {
  const paragraphs = message.split(/\r?\n/).filter(Boolean);

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.brand}>MatUp</Heading>
          <Heading style={styles.title}>{leagueName}</Heading>
          <Text style={styles.subtle}>
            {hostName} sent an update to this league.
          </Text>
          {paragraphs.map((line, index) => (
            <Text key={index} style={styles.message}>
              {line}
            </Text>
          ))}
          <Link href={link} style={styles.button}>
            View League
          </Link>
          <Hr style={styles.divider} />
          <Text style={styles.footer}>
            You received this email because you are part of this league on MatUp.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily: "Arial, sans-serif",
    padding: "24px",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e4e4e7",
    padding: "24px",
  },
  brand: {
    color: "#18181b",
    fontSize: "16px",
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
  },
  title: {
    color: "#18181b",
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  subtle: {
    color: "#71717a",
    fontSize: "13px",
    marginBottom: "16px",
  },
  message: {
    color: "#18181b",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "12px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#18181b",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    padding: "10px 18px",
    borderRadius: "999px",
    textDecoration: "none",
  },
  divider: {
    borderColor: "#f4f4f5",
    margin: "20px 0 12px",
  },
  footer: {
    color: "#71717a",
    fontSize: "12px",
  },
};
