import { PageTitle } from "@/components/ui/page-title";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return <PageTitle eyebrow={eyebrow} title={title} description={description} action={action} />;
}
