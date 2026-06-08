# Feedback on CGIAR Climate Data Hub Metadata Standard Repository

## 1. Purpose

This memo summarizes one round of feedback on the CGIAR Climate Data Hub metadata standard repository. It complements the GitHub issue set with a narrative view of the main themes, immediate improvements, and longer-term questions.

The aim is to strengthen near-term usability of the technical repository, clarify documentation and governance choices, support wider review and adoption, and prepare for eventual integration with the Climate Data Hub website frontend.

## 2. Overall impression

The repository is developing into a strong technical home for the metadata standard. The schema work, standards mappings, controlled vocabularies, templates, validation, and publishing workflows provide a credible foundation.

Brayden has clarified that the repository is intended to remain the technical home for the standard, with explainers and user-facing guides expected to sit on the future Climate Data Hub website frontend. That distinction is important. The issue is not that the repository is technical; the issue is that the website layer is not yet operational, so the repository still needs enough interim guidance to help current users orient themselves and use the standard.

## 3. Why this matters

The success of the metadata standard will depend on more than schema quality. It will also depend on whether contributors can understand how to use the repository now, whether the authoring workflow is practical, whether governance is clear, and whether the standard can gain traction across programs and centers.

This work is part of a broader shift toward reusable, interoperable, discoverable, and machine-readable CGIAR data assets. In the longer term, high-quality metadata also enables AI-assisted discovery, interrogation, reporting, visualization, and reuse. The standard should therefore be treated not only as a documentation artifact, but as technical infrastructure for a more coordinated and AI-ready data environment.

## 4. High-level themes

The feedback is organized into eight linked GitHub issues:

- Interim in-repo guidance until the CDH frontend exists ([#7](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/7))
- Technical repo framing and audience signaling ([#8](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/8))
- Schema/model clarity versus richer narrative metadata ([#9](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/9))
- Metadata authoring workflow, including AI-assisted approaches ([#10](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/10))
- Governance and stewardship of schema and vocabularies ([#11](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/11))
- Transition planning from repo guidance to website guidance ([#12](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/12))
- Engagement and adoption across programs ([#13](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/13))
- Roadmap and phasing across this cycle and next cycle ([#14](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/14))

The master tracking issue is [#6](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/6).

## 5. Immediate improvements

The most immediate need is to make the repository easier to use in its current transitional state. This does not require turning it into a public-facing explainer site. It requires enough orientation for current users to understand what the repository is, who it serves, how the main components fit together, and where richer user-facing materials are expected to live later.

The README and related guidance would benefit from clearer signaling that the repository is the technical/reference home of the standard. It should also explain the relationship between the authoring guide, templates, schema, standard, mappings, and vocabularies. A simple overview diagram would likely help.

There is also a near-term need to clarify where richer narrative metadata fits relative to the core schema, and to make the authoring workflow more explicit. At present, the technical structure is more visible than the path by which contributors are expected to produce high-quality metadata consistently.

## 6. Strategic questions

Several larger questions sit behind the immediate documentation improvements.

First, how should the repository distinguish between core structured metadata, richer descriptive/contextual metadata, extensions or sidecars, and linked documentation? This matters for expectations around methods, caveats, limitations, related code, provenance, and appropriate or inappropriate uses of data.

Second, is the standard being developed only as a schema and validation system, or also as part of a broader metadata production workflow? If it is the latter, then AI-assisted authoring, reuse of existing documentation, and guided authoring pathways should be considered part of the design.

Third, how will schema elements, controlled vocabularies, and mappings be governed? These components imply stewardship and decision-making responsibilities that should be explicit, especially if the standard is expected to support cross-program uptake.

Finally, what belongs permanently in the technical repository, what guidance is only interim, and what should eventually move to or integrate with the Climate Data Hub website frontend?

## 7. Audience and adoption

The repository serves several audiences: technical contributors, metadata authors, reviewers, and program-level stakeholders assessing whether and how the standard should be adopted. These groups do not need the same depth of explanation or the same entry point.

Audience signaling matters because adoption will require more than technical delivery. It will need review from relevant collaborators, clear communication beyond the core technical team, and an eventual website layer that can explain the standard to less technical users and decision-makers.

## 8. This cycle vs next cycle

Several improvements appear feasible in the current cycle: clearer interim guidance in the repository, stronger framing of the repository's technical role, better signposting across documents, basic clarification of metadata model boundaries, and initial notes on governance and authoring workflow.

Other items are better treated as medium-term or next-cycle work: fuller website explainers and user guides, more developed AI-assisted authoring workflows, stronger governance structures, deeper cross-program engagement, and more ambitious integration or federation pathways.

Keeping those two horizons separate will help avoid mixing near-term deliverables with broader strategic ambitions.

## 9. Recommended actions

Recommended near-term actions:

- Improve interim in-repo guidance.
- Clarify repository role and audience.
- Clarify how richer metadata fits with the core schema.
- Define a practical authoring pathway.
- Document a lightweight governance approach.
- Identify what content is interim versus future website content.
- Structure engagement and review across priority collaborators.
- Separate current-cycle priorities from next-cycle scope.

These actions are reflected in the companion GitHub issue set.

## 10. GitHub follow-up structure

The issue set is organized as one master feedback issue with eight themed child issues. This keeps development and strategic feedback distinct from future operational issues such as ingestion requests, support, and routine bug reporting.

The main child issues cover:

- Interim in-repo guidance ([#7](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/7))
- Technical repo framing ([#8](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/8))
- Schema/model clarity ([#9](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/9))
- Authoring workflow ([#10](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/10))
- Governance ([#11](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/11))
- Transition to CDH frontend ([#12](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/12))
- Engagement/adoption ([#13](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/13))
- Roadmap and phasing ([#14](https://github.com/CGIAR-Climate-Data-Hub/metadata/issues/14))
