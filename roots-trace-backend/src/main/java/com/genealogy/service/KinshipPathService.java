package com.genealogy.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.dto.response.RelationEdgeVO;
import com.genealogy.entity.Relation;
import com.genealogy.mapper.RelationMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * In-memory BFS for the shortest kinship path between two members of one family.
 *
 * Replaces the previous recursive-CTE implementation, which was path-enumeration
 * (each partial path carried its own visited array, so the same node was reached
 * by many paths and each spawned its own subtree — exponential in depth). Real
 * BFS with a single global visited set is O(V+E) and is not expressible in a
 * standard PostgreSQL recursive CTE, so we do it here.
 */
@Service
public class KinshipPathService {

    private static final int MAX_HOPS = 12;

    private final RelationMapper relationMapper;

    public KinshipPathService(RelationMapper relationMapper) {
        this.relationMapper = relationMapper;
    }

    public RelationEdgeVO findShortestPath(Long familyId, Long a, Long b) {
        if (a == null || b == null || familyId == null) {
            return null;
        }
        if (a.equals(b)) {
            RelationEdgeVO self = new RelationEdgeVO();
            self.setFromMemberId(a);
            self.setToMemberId(b);
            self.setPathEdges(new String[0]);
            return self;
        }

        List<Relation> relations = relationMapper.selectList(
                new LambdaQueryWrapper<Relation>().eq(Relation::getFamilyId, familyId));
        if (relations.isEmpty()) {
            return null;
        }

        // Undirected adjacency: parent/spouse edges are all traversable both ways
        // for "is related to" purposes. Remember the directed (from -> to, type)
        // so we can reconstruct edge strings matching the original schema.
        Map<Long, List<Edge>> adj = new HashMap<>(relations.size() * 2);
        for (Relation r : relations) {
            adj.computeIfAbsent(r.getFromMemberId(), k -> new java.util.ArrayList<>())
                    .add(new Edge(r.getFromMemberId(), r.getToMemberId(), r.getRelationType(), true));
            adj.computeIfAbsent(r.getToMemberId(), k -> new java.util.ArrayList<>())
                    .add(new Edge(r.getFromMemberId(), r.getToMemberId(), r.getRelationType(), false));
        }

        if (!adj.containsKey(a) || !adj.containsKey(b)) {
            return null;
        }

        Map<Long, Edge> parentEdge = new HashMap<>();
        Set<Long> visited = new HashSet<>();
        Map<Long, Integer> depth = new HashMap<>();
        Deque<Long> queue = new ArrayDeque<>();
        queue.add(a);
        visited.add(a);
        depth.put(a, 0);

        boolean found = false;
        while (!queue.isEmpty()) {
            Long cur = queue.poll();
            int d = depth.get(cur);
            if (d >= MAX_HOPS) continue;
            for (Edge e : adj.getOrDefault(cur, List.of())) {
                Long next = e.other(cur);
                if (visited.contains(next)) continue;
                visited.add(next);
                depth.put(next, d + 1);
                parentEdge.put(next, e);
                if (next.equals(b)) {
                    found = true;
                    break;
                }
                queue.add(next);
            }
            if (found) break;
        }
        if (!found) return null;

        // Reconstruct path from b back to a, then reverse.
        Deque<String> rev = new ArrayDeque<>();
        Long cur = b;
        String lastType = null;
        Long lastFrom = null;
        while (!cur.equals(a)) {
            Edge e = parentEdge.get(cur);
            // Render the edge in its original stored direction so the string
            // matches what the old SQL produced.
            rev.push(e.from + "->" + e.to);
            if (lastType == null) {
                lastType = e.type;
                lastFrom = e.other(b);
            }
            cur = e.other(cur);
        }
        String[] pathEdges = new String[rev.size()];
        int i = 0;
        while (!rev.isEmpty()) pathEdges[i++] = rev.pop();

        RelationEdgeVO vo = new RelationEdgeVO();
        vo.setFromMemberId(lastFrom);
        vo.setToMemberId(b);
        vo.setRelationType(lastType);
        vo.setPathEdges(pathEdges);
        return vo;
    }

    private record Edge(Long from, Long to, String type, boolean forward) {
        Long other(Long node) {
            return node.equals(from) ? to : from;
        }
    }
}
