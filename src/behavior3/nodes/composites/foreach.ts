import { Node, NodeDef } from "../../node";
import { Process, Status } from "../../process";
import { TreeEnv } from "../../tree-env";

type ForeachInput = [unknown[]];

export class Foreach extends Process {
    override run(node: Node, env: TreeEnv): Status {
        const [arr] = env.input as ForeachInput;
        let last = node.resume(env);
        let i: number = 0;
        let j: number = 0;

        if (last instanceof Array) {
            if (env.status === "running") {
                node.error(`unexpected status error`);
            }

            i = last[0];
            j = last[1] + 1;
            if (j >= node.children.length) {
                i++;
                j = 0;
            }
        }

        for (; i < arr.length; i++) {
            env.setValue(node.data.output![0], arr[i]);
            for (; j < node.children.length; j++) {
                const status = node.children[j].run(env);
                if (status === "running") {
                    if (last instanceof Array) {
                        last[0] = i;
                        last[1] = j;
                    } else {
                        last = [i, j];
                    }
                    return node.yield(env, last);
                }
            }
            j = 0;
        }

        return "success";
    }

    override get descriptor(): NodeDef {
        return {
            name: "ForEach",
            type: "Composite",
            desc: "遍历数组",
            input: ["[{数组}]"],
            output: ["{变量}"],
            doc: `
                + 每次执行子节点前会设置当前遍历到的变量
                + 会执行所有子节点
                + 永远返回成功/正在运行`,
        };
    }
}
