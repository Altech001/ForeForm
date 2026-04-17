import FormAgent from "@/components/agents/FormAgent";
import SEO from "@/components/SEO";

export default function AgentPage() {
    return (
        <>
            <SEO title="ForeForm Agent" path="/agent" />
            <FormAgent />
        </>
    );
}
