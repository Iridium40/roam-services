import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const partnerFaqData = [
  {
    id: "become-partner",
    question: "How can I become a service partner on ROAM?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        If you are a service provider interested in joining the ROAM Team, 
        download the app and submit the requested information for review. 
        You may also create your profile{" "}
        <a 
          href="https://roamyourbestlife.com/service-partner-sign-up/" 
          className="text-roam-blue font-semibold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          here.
        </a>
      </p>
    ),
  },
  {
    id: "information-requirements",
    question: "Why does ROAM ask for specific information when applying to become a service partner?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        ROAM requires the information necessary to verify identity and vet the 
        certifications and qualifications to deliver the services that our 
        members expect and deserve.
      </p>
    ),
  },
  {
    id: "service-control",
    question: "Why does ROAM control the services that are listed?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        ROAM provides a convenient and transparent connection to preferred 
        services and providers to its members. Service sectors are offered 
        based on demand and ROAM tracks and identifies the demand in our service 
        areas. We want providers to have easy access to members and vice versa, 
        so controlling the services offered ensures a more streamlined connection.
      </p>
    ),
  },
  {
    id: "customer-support",
    question: "How do I contact customer support?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        You may contact Customer Service at any time, either by email at{" "}
        <a 
          href="mailto:contactus@roamyourbestlife.com"
          className="text-roam-blue font-semibold hover:underline"
        >
          contactus@roamyourbestlife.com
        </a>{" "}
        or within the app by going to your profile in the bottom menu and then 
        selecting Contact Us in the list. You will be taken to a form that will 
        email our Customer Service group and we will respond in a timely manner.
      </p>
    ),
  },
  {
    id: "receive-tips",
    question: "Can I receive a tip from clients?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Yes, ROAM allows the clients to leave a tip after the session is 
        completed via the app.
      </p>
    ),
  },
  {
    id: "choose-services",
    question: "Can I choose the services I offer on ROAM?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Yes, ROAM provides a list of services supported on the app. As a 
        service provider, you decide what service you wish to offer to your clients.
      </p>
    ),
  },
  {
    id: "set-prices",
    question: "Who sets the prices for services on ROAM?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Our service providers set their own prices for the services they offer.
      </p>
    ),
  },
  {
    id: "free-trial",
    question: "Is there a free subscription trial available?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        No, we currently don't offer a free trial.
      </p>
    ),
  },
  {
    id: "cancel-subscription",
    question: "How do I cancel my subscription?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        You can cancel your subscription at any time in the app. Simply log 
        into the app, go to your profile in the bottom menu and then select 
        Subscriptions in the list. You will be taken to the Subscriptions page 
        where a Cancel Subscription button will allow you to cancel your 
        subscription at any time.
      </p>
    ),
  },
  {
    id: "auto-renew",
    question: "Do subscriptions auto-renew?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Yes, subscriptions auto-renew at the end of each billing cycle to ensure 
        uninterrupted access to the application's features and content.
      </p>
    ),
  },
  {
    id: "news-updates",
    question: "How can I learn about ROAM's latest news and partner events?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Sign up for our{" "}
        <a 
          href="https://roamyourbestlife.com/partner-resources/#link-newsletter"
          className="text-roam-blue font-semibold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          emails
        </a>{" "}
        and check our app and website regularly to stay in the loop on the 
        latest news and events.
      </p>
    ),
  },
];

interface PartnerFAQAccordionProps {
  className?: string;
}

export default function PartnerFAQAccordion({ className }: PartnerFAQAccordionProps) {
  return (
    <div className={className}>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {partnerFaqData.map((faq) => (
          <AccordionItem 
            key={faq.id} 
            value={faq.id}
            className="border border-roam-blue/10 rounded-lg px-6 bg-white hover:bg-gray-50/50 transition-colors"
          >
            <AccordionTrigger className="text-left font-medium text-gray-800 hover:text-roam-blue py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-0">
              <div className="pl-8">
                {faq.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
