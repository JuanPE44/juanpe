import type { StackGroup } from "@/content";
import { Panel } from "@/ui/Panel";
import { Tag } from "@/ui/Tag";

export function Stack({ groups }: { groups: StackGroup[] }) {
  return (
    <div className="grid gap-4 @md:grid-cols-2">
      {groups.map((group, i) => (
        <Panel key={group.id} label={group.label} data-pick={i}>
          <ul className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <li key={item}>
                <Tag>{item}</Tag>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
